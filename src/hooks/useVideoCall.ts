import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getIceServers,
  openCallChannel,
  type CallChannel,
  type CallEndReason,
  type CallEvent,
  type CallMedia,
  type CallSignal,
} from '@/services/calls'

export type CallStatus =
  | 'idle'
  | 'calling'
  | 'incoming'
  | 'connecting'
  | 'connected'
  | 'ending'
  | 'ended'

export interface CallPeer {
  id: string
  otherUserId: string
  otherUserName: string
}

export interface StartCallInput {
  conversationId: string
  otherUserId: string
  otherUserName: string
  media: CallMedia
}

export interface UseCallSessionInput {
  selfId: string | null
  conversations: CallPeer[]
}

const RING_TIMEOUT_MS = 45_000
const ENDED_NOTICE_MS = 2_000

function mediaErrorMessage(error: unknown, media: CallMedia): string {
  const name = error instanceof DOMException ? error.name : ''
  const device = media === 'voice' ? 'microphone' : 'camera and microphone'
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return `Access to your ${device} was blocked. Allow access in your browser to make a call.`
    case 'NotFoundError':
    case 'OverconstrainedError':
      return media === 'voice'
        ? 'No microphone was found on this device.'
        : 'No camera or microphone was found on this device.'
    case 'NotReadableError':
      return `Your ${device} ${media === 'voice' ? 'is' : 'are'} already being used by another application.`
    default:
      return error instanceof Error
        ? error.message
        : `Unable to start your ${device}.`
  }
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

/**
 * App-wide one-to-one calling. Signaling channels stay open for every
 * conversation the user belongs to, so an invite can ring on the dashboard.
 */
export function useCallSession({ selfId, conversations }: UseCallSessionInput) {
  const [status, setStatus] = useState<CallStatus>('idle')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [media, setMedia] = useState<CallMedia>('video')
  const [peerName, setPeerName] = useState('')
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  )

  const statusRef = useRef<CallStatus>('idle')
  const selfIdRef = useRef(selfId)
  const conversationsRef = useRef(conversations)
  selfIdRef.current = selfId
  conversationsRef.current = conversations

  const channelsRef = useRef(new Map<string, CallChannel>())
  const readyRef = useRef(new Set<string>())
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const callIdRef = useRef<string | null>(null)
  const peerIdRef = useRef<string | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const mediaRef = useRef<CallMedia>('video')
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const remoteDescriptionSetRef = useRef(false)
  const acceptedRef = useRef(false)
  const ringTimerRef = useRef<number | null>(null)
  const endedTimerRef = useRef<number | null>(null)
  const handleSignalRef = useRef<
    (conversationId: string, event: CallEvent, signal: CallSignal) => void
  >(() => {})

  const conversationKey = conversations
    .map((conversation) => conversation.id)
    .sort()
    .join(',')

  const updateStatus = useCallback((next: CallStatus) => {
    statusRef.current = next
    setStatus(next)
  }, [])

  const clearRingTimer = useCallback(() => {
    if (ringTimerRef.current !== null) {
      window.clearTimeout(ringTimerRef.current)
      ringTimerRef.current = null
    }
  }, [])

  const lookupPeer = useCallback((conversationId: string, fallbackId?: string) => {
    return conversationsRef.current.find(
      (conversation) =>
        conversation.id === conversationId ||
        (fallbackId ? conversation.otherUserId === fallbackId : false),
    )
  }, [])

  const teardown = useCallback(() => {
    clearRingTimer()

    const pc = pcRef.current
    if (pc) {
      pc.onicecandidate = null
      pc.ontrack = null
      pc.onconnectionstatechange = null
      pc.close()
      pcRef.current = null
    }

    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setRemoteStream(null)

    callIdRef.current = null
    peerIdRef.current = null
    conversationIdRef.current = null
    pendingOfferRef.current = null
    pendingCandidatesRef.current = []
    remoteDescriptionSetRef.current = false
    acceptedRef.current = false
    setActiveConversationId(null)
    setMicEnabled(true)
    setCameraEnabled(true)
  }, [clearRingTimer])

  const sendSignal = useCallback(
    async (event: CallEvent, extra: Partial<CallSignal> = {}) => {
      const conversationId = conversationIdRef.current
      const channel = conversationId
        ? channelsRef.current.get(conversationId)
        : undefined
      const callId = callIdRef.current
      const senderId = selfIdRef.current
      const targetId = peerIdRef.current
      if (!channel || !callId || !senderId || !targetId) return
      await channel.send(event, {
        callId,
        senderId,
        targetId,
        media: mediaRef.current,
        ...extra,
      })
    },
    [],
  )

  const emitSignal = useCallback(
    (event: CallEvent, extra: Partial<CallSignal> = {}) => {
      void sendSignal(event, extra).catch((signalError) => {
        console.warn(`[PawSphere Calls] Failed to send ${event}:`, signalError)
      })
    },
    [sendSignal],
  )

  const finishCall = useCallback(
    (message: string) => {
      teardown()
      setStatusMessage(message)
      updateStatus('ended')

      if (endedTimerRef.current !== null) {
        window.clearTimeout(endedTimerRef.current)
      }
      endedTimerRef.current = window.setTimeout(() => {
        endedTimerRef.current = null
        setStatusMessage(null)
        setPeerName('')
        updateStatus('idle')
      }, ENDED_NOTICE_MS)
    },
    [teardown, updateStatus],
  )

  const failCall = useCallback(
    (message: string) => {
      setError(message)
      finishCall('Call ended')
    },
    [finishCall],
  )

  const flushPendingCandidates = useCallback(async () => {
    const pc = pcRef.current
    if (!pc) return

    const queued = pendingCandidatesRef.current
    pendingCandidatesRef.current = []
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (candidateError) {
        console.warn('[PawSphere Calls] Discarded an ICE candidate:', candidateError)
      }
    }
  }, [])

  const requestMedia = useCallback(async (kind: CallMedia) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'This browser cannot access media devices. Use a recent browser over HTTPS or localhost.',
      )
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: kind === 'video',
    })
    localStreamRef.current = stream
    setLocalStream(stream)
    setMicEnabled(true)
    setCameraEnabled(kind === 'video')
    return stream
  }, [])

  const createPeerConnection = useCallback(
    (stream: MediaStream) => {
      const pc = new RTCPeerConnection({ iceServers: getIceServers() })
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          emitSignal('ice_candidate', { candidate: event.candidate.toJSON() })
        }
      }

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0] ?? null)
      }

      pc.onconnectionstatechange = () => {
        switch (pc.connectionState) {
          case 'connected':
            clearRingTimer()
            setStatusMessage(null)
            updateStatus('connected')
            break
          case 'disconnected':
            setStatusMessage('Reconnecting…')
            updateStatus('connecting')
            break
          case 'failed':
            failCall('The call connection failed.')
            break
          case 'closed':
            if (statusRef.current !== 'idle' && statusRef.current !== 'ended') {
              finishCall('Call ended')
            }
            break
          default:
            break
        }
      }

      pcRef.current = pc
      return pc
    },
    [clearRingTimer, emitSignal, failCall, finishCall, updateStatus],
  )

  const answerOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      const pc = pcRef.current
      if (!pc) return

      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      remoteDescriptionSetRef.current = true
      await flushPendingCandidates()

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await sendSignal('webrtc_answer', { sdp: answer })
    },
    [flushPendingCandidates, sendSignal],
  )

  const applyAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      const pc = pcRef.current
      if (!pc || pc.signalingState === 'stable') return

      await pc.setRemoteDescription(new RTCSessionDescription(answer))
      remoteDescriptionSetRef.current = true
      await flushPendingCandidates()
    },
    [flushPendingCandidates],
  )

  const handleSignal = useCallback(
    (conversationId: string, event: CallEvent, signal: CallSignal) => {
      const self = selfIdRef.current
      if (!self || signal.targetId !== self) return

      const peer = lookupPeer(conversationId, signal.senderId)
      if (peer && signal.senderId !== peer.otherUserId) return

      if (event === 'call_invite') {
        const channel = channelsRef.current.get(conversationId)
        if (statusRef.current !== 'idle') {
          void channel
            ?.send('call_reject', {
              callId: signal.callId,
              senderId: self,
              targetId: signal.senderId,
              reason: 'busy',
              media: signal.media ?? 'video',
            })
            .catch((rejectError) => {
              console.warn('[PawSphere Calls] Failed to refuse a call:', rejectError)
            })
          return
        }

        const kind = signal.media === 'voice' ? 'voice' : 'video'
        callIdRef.current = signal.callId
        peerIdRef.current = signal.senderId
        conversationIdRef.current = conversationId
        mediaRef.current = kind
        acceptedRef.current = false
        setActiveConversationId(conversationId)
        setMedia(kind)
        setPeerName(peer?.otherUserName ?? 'Incoming call')
        setError(null)
        setStatusMessage(null)
        updateStatus('incoming')
        return
      }

      if (
        conversationIdRef.current !== conversationId ||
        !callIdRef.current ||
        signal.callId !== callIdRef.current
      ) {
        return
      }

      switch (event) {
        case 'call_accept':
          if (statusRef.current === 'calling') {
            setStatusMessage('Connecting…')
            updateStatus('connecting')
          }
          break

        case 'call_reject':
          finishCall(
            signal.reason === 'busy'
              ? 'They are already on another call'
              : 'Call declined',
          )
          break

        case 'webrtc_offer':
          if (!signal.sdp) break
          pendingOfferRef.current = signal.sdp
          if (acceptedRef.current) {
            void answerOffer(signal.sdp).catch((offerError) => {
              console.error('[PawSphere Calls] Failed to answer the offer:', offerError)
              failCall('The call could not be negotiated.')
            })
          }
          break

        case 'webrtc_answer':
          if (!signal.sdp) break
          void applyAnswer(signal.sdp).catch((answerError) => {
            console.error('[PawSphere Calls] Failed to apply the answer:', answerError)
            failCall('The call could not be negotiated.')
          })
          break

        case 'ice_candidate':
          if (!signal.candidate) break
          if (pcRef.current && remoteDescriptionSetRef.current) {
            void pcRef.current
              .addIceCandidate(new RTCIceCandidate(signal.candidate))
              .catch((candidateError) => {
                console.warn('[PawSphere Calls] Discarded an ICE candidate:', candidateError)
              })
          } else {
            pendingCandidatesRef.current.push(signal.candidate)
          }
          break

        case 'call_end':
          if (statusRef.current === 'idle') break
          finishCall('Call ended')
          break

        default:
          break
      }
    },
    [answerOffer, applyAnswer, failCall, finishCall, lookupPeer, updateStatus],
  )

  handleSignalRef.current = handleSignal

  const attachChannel = useCallback((conversationId: string) => {
    if (channelsRef.current.has(conversationId)) return

    const channel = openCallChannel(conversationId, {
      onSignal: (event, signal) => {
        handleSignalRef.current(conversationId, event, signal)
      },
      onReady: () => {
        readyRef.current.add(conversationId)
      },
      onError: () => {
        readyRef.current.delete(conversationId)
        if (
          conversationIdRef.current === conversationId &&
          statusRef.current !== 'idle'
        ) {
          failCall('Lost the call signaling connection.')
        }
      },
    })
    channelsRef.current.set(conversationId, channel)
  }, [failCall])

  useEffect(() => {
    if (!selfId) {
      for (const channel of channelsRef.current.values()) {
        channel.close()
      }
      channelsRef.current.clear()
      readyRef.current.clear()
      return
    }

    const wanted = new Set(
      conversationKey ? conversationKey.split(',') : [],
    )
    if (conversationIdRef.current) {
      wanted.add(conversationIdRef.current)
    }

    for (const [id, channel] of channelsRef.current) {
      if (!wanted.has(id)) {
        channel.close()
        channelsRef.current.delete(id)
        readyRef.current.delete(id)
      }
    }

    for (const id of wanted) {
      attachChannel(id)
    }
  }, [attachChannel, conversationKey, selfId])

  useEffect(() => {
    return () => {
      if (statusRef.current !== 'idle' && statusRef.current !== 'ended') {
        const callId = callIdRef.current
        const target = peerIdRef.current
        const conversationId = conversationIdRef.current
        const channel = conversationId
          ? channelsRef.current.get(conversationId)
          : undefined
        if (channel && callId && target && selfIdRef.current) {
          void channel
            .send('call_end', {
              callId,
              senderId: selfIdRef.current,
              targetId: target,
              reason: 'hangup',
              media: mediaRef.current,
            })
            .catch(() => {})
        }
      }

      teardown()
      if (endedTimerRef.current !== null) {
        window.clearTimeout(endedTimerRef.current)
      }
      for (const channel of channelsRef.current.values()) {
        channel.close()
      }
      channelsRef.current.clear()
      readyRef.current.clear()
    }
  }, [teardown])

  useEffect(() => {
    const handleUnload = () => {
      if (statusRef.current === 'idle') return
      const callId = callIdRef.current
      const target = peerIdRef.current
      const self = selfIdRef.current
      const conversationId = conversationIdRef.current
      const channel = conversationId
        ? channelsRef.current.get(conversationId)
        : undefined
      if (channel && callId && target && self) {
        void channel.send('call_end', {
          callId,
          senderId: self,
          targetId: target,
          reason: 'hangup',
          media: mediaRef.current,
        })
      }
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  const waitForChannel = useCallback(async (conversationId: string) => {
    attachChannel(conversationId)
    const started = Date.now()
    while (!readyRef.current.has(conversationId)) {
      if (Date.now() - started > 5_000) return false
      await wait(100)
    }
    return true
  }, [attachChannel])

  const startCall = useCallback(
    async (input: StartCallInput) => {
      if (statusRef.current !== 'idle') return
      if (!selfIdRef.current) {
        setError('Sign in before starting a call.')
        return
      }

      setError(null)
      mediaRef.current = input.media
      conversationIdRef.current = input.conversationId
      peerIdRef.current = input.otherUserId
      callIdRef.current = crypto.randomUUID()
      setMedia(input.media)
      setPeerName(input.otherUserName)
      setActiveConversationId(input.conversationId)
      setStatusMessage('Calling…')
      updateStatus('calling')

      try {
        const ready = await waitForChannel(input.conversationId)
        if (!ready) {
          throw new Error('The call service is still connecting. Try again in a moment.')
        }

        const stream = await requestMedia(input.media)
        const pc = createPeerConnection(stream)
        const offer = await pc.createOffer()

        await sendSignal('call_invite')
        await pc.setLocalDescription(offer)
        await sendSignal('webrtc_offer', { sdp: offer })

        clearRingTimer()
        ringTimerRef.current = window.setTimeout(() => {
          ringTimerRef.current = null
          if (statusRef.current === 'calling' || statusRef.current === 'connecting') {
            emitSignal('call_end', { reason: 'no_answer' })
            finishCall('No answer')
          }
        }, RING_TIMEOUT_MS)
      } catch (startError) {
        console.error('[PawSphere Calls] Unable to start the call:', startError)
        setError(mediaErrorMessage(startError, input.media))
        teardown()
        setStatusMessage(null)
        setPeerName('')
        updateStatus('idle')
      }
    },
    [
      clearRingTimer,
      createPeerConnection,
      emitSignal,
      finishCall,
      requestMedia,
      sendSignal,
      teardown,
      updateStatus,
      waitForChannel,
    ],
  )

  const acceptCall = useCallback(async () => {
    if (statusRef.current !== 'incoming') return

    acceptedRef.current = true
    setStatusMessage('Connecting…')
    updateStatus('connecting')

    try {
      const stream = await requestMedia(mediaRef.current)
      createPeerConnection(stream)
      await sendSignal('call_accept')

      const offer = pendingOfferRef.current
      if (offer) {
        await answerOffer(offer)
      }
    } catch (acceptError) {
      console.error('[PawSphere Calls] Unable to accept the call:', acceptError)
      emitSignal('call_reject', { reason: 'failed' })
      setError(mediaErrorMessage(acceptError, mediaRef.current))
      teardown()
      setStatusMessage(null)
      setPeerName('')
      updateStatus('idle')
    }
  }, [
    answerOffer,
    createPeerConnection,
    emitSignal,
    requestMedia,
    sendSignal,
    teardown,
    updateStatus,
  ])

  const rejectCall = useCallback(() => {
    if (statusRef.current !== 'incoming') return
    emitSignal('call_reject', { reason: 'declined' })
    teardown()
    setStatusMessage(null)
    setPeerName('')
    updateStatus('idle')
  }, [emitSignal, teardown, updateStatus])

  const endCall = useCallback(() => {
    const current = statusRef.current
    if (current === 'idle' || current === 'ended') return
    if (current === 'incoming') {
      rejectCall()
      return
    }

    updateStatus('ending')
    emitSignal('call_end', { reason: 'hangup' })
    finishCall('Call ended')
  }, [emitSignal, finishCall, rejectCall, updateStatus])

  const toggleMic = useCallback(() => {
    const tracks = localStreamRef.current?.getAudioTracks() ?? []
    if (tracks.length === 0) return
    const next = !tracks[0].enabled
    tracks.forEach((track) => {
      track.enabled = next
    })
    setMicEnabled(next)
  }, [])

  const toggleCamera = useCallback(() => {
    if (mediaRef.current !== 'video') return
    const tracks = localStreamRef.current?.getVideoTracks() ?? []
    if (tracks.length === 0) return
    const next = !tracks[0].enabled
    tracks.forEach((track) => {
      track.enabled = next
    })
    setCameraEnabled(next)
  }, [])

  const dismissError = useCallback(() => setError(null), [])

  return {
    status,
    statusMessage,
    error,
    localStream,
    remoteStream,
    micEnabled,
    cameraEnabled,
    media,
    peerName,
    activeConversationId,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
    dismissError,
  }
}
