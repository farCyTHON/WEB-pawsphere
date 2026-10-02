import { useEffect, useRef } from 'react'
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react'

import type { CallStatus } from '@/hooks/useVideoCall'
import type { CallMedia } from '@/services/calls'

export interface VideoCallProps {
  status: CallStatus
  statusMessage: string | null
  media: CallMedia
  peerName: string
  peerInitials: string
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  micEnabled: boolean
  cameraEnabled: boolean
  onAccept: () => void
  onDecline: () => void
  onToggleMic: () => void
  onToggleCamera: () => void
  onEnd: () => void
}

function statusLabel(status: CallStatus, statusMessage: string | null) {
  if (statusMessage) return statusMessage
  switch (status) {
    case 'calling':
      return 'Calling…'
    case 'connecting':
      return 'Connecting…'
    case 'connected':
      return 'Connected'
    case 'ending':
      return 'Ending…'
    case 'ended':
      return 'Call ended'
    default:
      return ''
  }
}

export function VideoCallSurface({
  status,
  statusMessage,
  media,
  peerName,
  peerInitials,
  localStream,
  remoteStream,
  micEnabled,
  cameraEnabled,
  onAccept,
  onDecline,
  onToggleMic,
  onToggleCamera,
  onEnd,
}: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const element = localVideoRef.current
    if (element && element.srcObject !== localStream) {
      element.srcObject = localStream
    }
  }, [localStream, status])

  useEffect(() => {
    const element = remoteVideoRef.current
    if (element && element.srcObject !== remoteStream) {
      element.srcObject = remoteStream
    }
  }, [remoteStream, status])

  useEffect(() => {
    const element = remoteAudioRef.current
    if (element && element.srcObject !== remoteStream) {
      element.srcObject = remoteStream
    }
  }, [remoteStream, status])

  const isVoice = media === 'voice'
  const remoteHasVideo = Boolean(
    !isVoice &&
      remoteStream
        ?.getVideoTracks()
        .some((track) => track.readyState === 'live'),
  )

  if (status === 'idle') return null

  if (status === 'incoming') {
    return (
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#111827]/40 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-[18px] bg-white p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#16A34A] text-lg font-bold text-white">
            {peerInitials}
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#111827]">{peerName}</h2>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-[#6B7280]">
            {isVoice ? (
              <Phone size={14} className="text-[#16A34A]" />
            ) : (
              <Video size={14} className="text-[#16A34A]" />
            )}
            Incoming {isVoice ? 'voice' : 'video'} call
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={onDecline}
              className="flex-1 rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#DC2626] hover:bg-[#FEF2F2]"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              className="flex-1 rounded-[12px] bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15803D]"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    )
  }

  const label = statusLabel(status, statusMessage)

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-[#111827] p-4">
      <div className="relative flex-1 overflow-hidden rounded-[18px] bg-black">
        <audio ref={remoteAudioRef} autoPlay className="hidden" />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`h-full w-full object-cover ${remoteHasVideo ? '' : 'invisible'}`}
        />

        {!remoteHasVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#16A34A] text-xl font-bold text-white">
              {peerInitials}
            </div>
            <p className="mt-4 text-base font-semibold text-white">{peerName}</p>
            <p className="mt-1 text-sm text-[#9CA3AF]">{label}</p>
          </div>
        )}

        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === 'connected' ? 'bg-[#16A34A]' : 'bg-[#F59E0B]'
            }`}
          />
          <span className="text-[11px] font-medium text-white">
            {peerName} · {label}
          </span>
        </div>

        {!isVoice && (
          <div className="absolute bottom-4 right-4 h-32 w-24 overflow-hidden rounded-[14px] border border-white/20 bg-[#1F2937] shadow-lg sm:h-40 sm:w-32">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover [transform:scaleX(-1)] ${
                cameraEnabled ? '' : 'invisible'
              }`}
            />
            {!cameraEnabled && (
              <div className="absolute inset-0 flex items-center justify-center">
                <VideoOff size={18} className="text-[#9CA3AF]" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 pt-4">
        <button
          onClick={onToggleMic}
          aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
            micEnabled
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-white text-[#111827] hover:bg-[#F8FAFC]'
          }`}
        >
          {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        {!isVoice && (
          <button
            onClick={onToggleCamera}
            aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
            title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              cameraEnabled
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-white text-[#111827] hover:bg-[#F8FAFC]'
            }`}
          >
            {cameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
          </button>
        )}

        <button
          onClick={onEnd}
          aria-label="End call"
          title="End call"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DC2626] text-white transition-colors hover:bg-[#B91C1C]"
        >
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  )
}
