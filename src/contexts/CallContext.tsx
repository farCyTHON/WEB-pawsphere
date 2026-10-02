import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { VideoCallSurface } from '@/components/messages/VideoCall'
import { useAuth } from '@/contexts/AuthContext'
import {
  useCallSession,
  type CallPeer,
} from '@/hooks/useVideoCall'
import {
  getUserConversations,
  subscribeToInbox,
} from '@/services/messages'

type CallSession = ReturnType<typeof useCallSession>

const CallContext = createContext<CallSession | null>(null)

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<CallPeer[]>([])

  useEffect(() => {
    if (!user) {
      setConversations([])
      return
    }

    let active = true
    const load = () => {
      void getUserConversations()
        .then((rows) => {
          if (!active) return
          setConversations(
            rows.map((row) => ({
              id: row.id,
              otherUserId: row.other_user_id,
              otherUserName: row.other_user_name,
            })),
          )
        })
        .catch((loadError) => {
          console.warn('[PawSphere Calls] Unable to load call roster:', loadError)
        })
    }

    load()

    const unsubscribe = subscribeToInbox(
      {
        userId: user.id,
        conversationIds: [],
        channelName: `call-roster:${user.id}`,
      },
      {
        onMessage: () => {},
        onConversation: load,
      },
    )

    return () => {
      active = false
      unsubscribe()
    }
  }, [user?.id])

  const session = useCallSession({
    selfId: user?.id ?? null,
    conversations,
  })

  return (
    <CallContext.Provider value={session}>
      {children}
      <CallHost call={session} />
    </CallContext.Provider>
  )
}

export function useCall() {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error('useCall must be used inside CallProvider')
  }
  return context
}

function initialsFrom(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'PS'
  )
}

function CallHost({ call }: { call: CallSession }) {
  return (
    <>
      {call.error && (
        <div
          role="alert"
          className="fixed right-5 top-5 z-[100] rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-lg"
        >
          {call.error}
          <button
            onClick={call.dismissError}
            className="ml-3 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}
      <VideoCallSurface
        status={call.status}
        statusMessage={call.statusMessage}
        media={call.media}
        peerName={call.peerName || 'Incoming call'}
        peerInitials={initialsFrom(call.peerName || 'Incoming call')}
        localStream={call.localStream}
        remoteStream={call.remoteStream}
        micEnabled={call.micEnabled}
        cameraEnabled={call.cameraEnabled}
        onAccept={() => void call.acceptCall()}
        onDecline={call.rejectCall}
        onToggleMic={call.toggleMic}
        onToggleCamera={call.toggleCamera}
        onEnd={call.endCall}
      />
    </>
  )
}
