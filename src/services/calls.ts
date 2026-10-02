import { supabase } from '@/lib/supabase'

/** Signaling events exchanged over the private call channel. */
export const CALL_EVENTS = [
  'call_invite',
  'call_accept',
  'call_reject',
  'webrtc_offer',
  'webrtc_answer',
  'ice_candidate',
  'call_end',
] as const

export type CallEvent = (typeof CALL_EVENTS)[number]

export type CallEndReason = 'declined' | 'busy' | 'hangup' | 'failed' | 'no_answer'

export type CallMedia = 'voice' | 'video'

export interface CallSignal {
  callId: string
  senderId: string
  targetId: string
  media?: CallMedia
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
  reason?: CallEndReason
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  {
    urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
  },
]

/**
 * ICE servers are read from VITE_WEBRTC_ICE_SERVERS, a JSON array of RTCIceServer
 * entries, so a TURN server can be supplied per environment without touching the
 * WebRTC layer. Falls back to public STUN, which is enough for local demo testing
 * but not for peers behind restrictive NATs.
 */
export function getIceServers(): RTCIceServer[] {
  const raw = import.meta.env.VITE_WEBRTC_ICE_SERVERS
  if (!raw) return DEFAULT_ICE_SERVERS

  try {
    const parsed = JSON.parse(raw) as RTCIceServer[]
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
    console.warn('[PawSphere Calls] VITE_WEBRTC_ICE_SERVERS is empty; using default STUN servers.')
  } catch (parseError) {
    console.warn(
      '[PawSphere Calls] VITE_WEBRTC_ICE_SERVERS is not valid JSON; using default STUN servers.',
      parseError,
    )
  }
  return DEFAULT_ICE_SERVERS
}

export interface CallChannel {
  send: (event: CallEvent, payload: CallSignal) => Promise<void>
  close: () => void
}

export interface CallChannelHandlers {
  onSignal: (event: CallEvent, signal: CallSignal) => void
  onReady?: () => void
  onError?: (error: unknown) => void
}

/**
 * Opens the private Broadcast channel used to negotiate calls for one conversation.
 * Authorization is enforced by the realtime.messages policies in
 * supabase/migrations/20260822_call_signaling.sql, which reuse user_in_conversation().
 * Returns a handle whose close() removes the channel.
 */
export function openCallChannel(
  conversationId: string,
  handlers: CallChannelHandlers,
): CallChannel {
  const channel = supabase.channel(`call:${conversationId}`, {
    config: { private: true, broadcast: { self: false } },
  })

  for (const event of CALL_EVENTS) {
    channel.on('broadcast', { event }, (message) => {
      const signal = message.payload as CallSignal | undefined
      if (signal?.callId && signal.senderId && signal.targetId) {
        handlers.onSignal(event, signal)
      }
    })
  }

  void (async () => {
    // A private channel is authorized with the user's JWT, so make sure the
    // socket carries the current token before joining.
    try {
      await supabase.realtime.setAuth()
    } catch (authError) {
      console.warn('[PawSphere Calls] Unable to refresh the realtime token:', authError)
    }

    channel.subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        handlers.onReady?.()
        return
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`[PawSphere Calls] Signaling channel ${status}:`, error)
        handlers.onError?.(error ?? new Error(status))
      }
    })
  })()

  return {
    send: async (event, payload) => {
      const result = await channel.send({ type: 'broadcast', event, payload })
      if (result !== 'ok') {
        throw new Error('Unable to reach the other participant.')
      }
    },
    close: () => {
      void supabase.removeChannel(channel)
    },
  }
}
