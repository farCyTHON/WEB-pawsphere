import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, Phone, Plus, Search, Send, Video, X } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import {
  useConversationMessages,
  useMessageContacts,
  useUserConversations,
} from '@/hooks/useMessages'

export function MessagesInbox() {
  const { user } = useAuth()
  const {
    conversations,
    loading,
    error,
    refresh,
    markRead,
    updateConversationLastMessage,
  } = useUserConversations()
  const { contacts, loading: contactsLoading, startConversation } =
    useMessageContacts()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [callNotice, setCallNotice] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeError, setComposeError] = useState('')

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null
  const {
    messages,
    loading: messagesLoading,
    send,
  } = useConversationMessages(selectedId, {
    onNewMessage: (newMsg) => {
      // Step 5: Update conversation list immediately on real-time message arrival
      updateConversationLastMessage(
        newMsg.conversation_id,
        newMsg.content,
        newMsg.created_at,
      )
      if (selectedId === newMsg.conversation_id) {
        markRead(newMsg.conversation_id)
      }
    },
  })

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id)
    }
  }, [conversations, selectedId])

  useEffect(() => {
    if (selectedId) markRead(selectedId)
  }, [selectedId, markRead, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, selectedId])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return conversations
    return conversations.filter(
      (conversation) =>
        conversation.other_user_name.toLowerCase().includes(query) ||
        (conversation.last_message ?? '').toLowerCase().includes(query) ||
        (conversation.pet_name ?? '').toLowerCase().includes(query),
    )
  }, [conversations, search])

  const sendCurrent = async () => {
    if (!input.trim() || !selectedId) return
    const text = input.trim()
    setSending(true)
    setSendError('')
    try {
      setInput('')
      await send(text, user?.id)
      updateConversationLastMessage(selectedId, text, new Date().toISOString())
      markRead(selectedId)
      void refresh(true)
    } catch (err) {
      setInput(text)
      setSendError(
        err instanceof Error ? err.message : 'Unable to send message.',
      )
    } finally {
      setSending(false)
    }
  }

  const openContact = async (contactId: string) => {
    const contact = contacts.find(
      (item) =>
        `${item.participant_id}-${item.pet_id ?? 'none'}-${item.conversation_type}` ===
        contactId,
    )
    if (!contact) return
    setComposeError('')
    try {
      const conversationId = await startConversation(contact)
      await refresh()
      setSelectedId(conversationId)
      setComposeOpen(false)
    } catch (startError: unknown) {
      console.error('[PawSphere openContact] Failed to start conversation:', startError)
      const msg =
        startError instanceof Error
          ? startError.message
          : 'Unable to start conversation.'
      setComposeError(msg)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Messages</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Chat with shelters and veterinarians about your pets
          </p>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15803D]"
        >
          <Plus size={15} /> New message
        </button>
      </div>

      {loading ? (
        <MessagesSkeleton />
      ) : error ? (
        <Empty
          title="Unable to load messages"
          text={error}
        />
      ) : conversations.length === 0 ? (
        <Empty
          title="Your inbox is calm"
          text="When a shelter or veterinarian replies, the conversation will appear here."
          action={
            <button
              onClick={() => setComposeOpen(true)}
              className="rounded-[14px] bg-[#16A34A] px-4 py-2.5 text-xs font-semibold text-white"
            >
              Start a conversation
            </button>
          }
        />
      ) : (
        <div className="flex h-[600px] overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
          <div className="flex w-72 flex-col border-r border-[#E5E7EB]">
            <div className="border-b border-[#E5E7EB] p-3">
              <div className="flex items-center gap-2 rounded-[8px] bg-[#F8FAFC] px-3 py-2">
                <Search size={13} className="text-[#9CA3AF]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder-[#9CA3AF]"
                  placeholder="Search..."
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map((conversation) => {
                const initials = initialsFrom(conversation.other_user_name)
                const roleLabel =
                  conversation.other_user_role === 'vet'
                    ? 'Veterinarian'
                    : conversation.other_user_role === 'shelter'
                      ? 'Shelter'
                      : 'Pet Owner'
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedId(conversation.id)}
                    className={`flex w-full items-start gap-3 border-b border-[#F1F5F9] px-4 py-3.5 text-left transition-colors hover:bg-[#F8FAFC] ${
                      selectedId === conversation.id ? 'bg-[#F0FDF4]' : ''
                    }`}
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-[11px] font-bold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-sm font-semibold text-[#111827]">
                          {conversation.other_user_name}
                        </p>
                        <span className="flex-shrink-0 text-[11px] text-[#9CA3AF]">
                          {formatTime(conversation.last_message_at ?? conversation.updated_at)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-[#6B7280]">
                        {conversation.last_message || `New chat · ${roleLabel}`}
                      </p>
                    </div>
                    {conversation.unread && (
                      <span className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#16A34A]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            {selected ? (
              <>
                <div className="flex h-[72px] items-center gap-3 border-b border-[#E5E7EB] px-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16A34A] text-[11px] font-bold text-white">
                    {initialsFrom(selected.other_user_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#111827]">
                      {selected.other_user_name}
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                      {selected.other_user_role === 'vet'
                        ? 'Veterinarian'
                        : selected.other_user_role === 'shelter'
                          ? 'Shelter'
                          : 'Pet Owner'}
                      {selected.pet_name ? ` · ${selected.pet_name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCallNotice('Voice call feature coming soon')}
                      aria-label="Voice call"
                      title="Voice call coming soon"
                      className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#E5E7EB] bg-white text-[#16A34A] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Phone size={17} />
                    </button>
                    <button
                      onClick={() => setCallNotice('Video call feature coming soon')}
                      aria-label="Video call"
                      title="Video call coming soon"
                      className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#16A34A] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#15803D] hover:shadow-md"
                    >
                      <Video size={17} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {messagesLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={index}
                          className={`h-12 w-2/3 animate-pulse rounded-[12px] bg-[#E5E7EB] ${
                            index % 2 === 0 ? '' : 'ml-auto'
                          }`}
                        />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center">
                      <div>
                        <MessageSquare className="mx-auto text-[#16A34A]" size={28} />
                        <p className="mt-3 text-sm font-semibold text-[#111827]">No messages yet</p>
                        <p className="mt-1 text-xs text-[#6B7280]">
                          Say hello to start the conversation.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const mine = message.sender_id === user?.id
                      return (
                        <div
                          key={message.id}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[65%] rounded-[12px] px-4 py-2.5 text-sm ${
                              mine
                                ? 'rounded-br-[4px] bg-[#16A34A] text-white'
                                : 'rounded-bl-[4px] bg-[#F1F5F9] text-[#111827]'
                            }`}
                          >
                            <p>{message.content}</p>
                            <p
                              className={`mt-1 text-[10px] ${
                                mine ? 'text-green-200' : 'text-[#9CA3AF]'
                              }`}
                            >
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex items-center gap-3 border-t border-[#E5E7EB] p-4">
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void sendCurrent()
                    }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#16A34A]"
                  />
                  <button
                    disabled={sending || !input.trim()}
                    onClick={() => void sendCurrent()}
                    className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#16A34A] transition-colors hover:bg-[#15803D] disabled:opacity-60"
                  >
                    <Send size={15} className="text-white" />
                  </button>
                </div>
              </>
            ) : (
              <Empty title="Select a conversation" text="Choose a chat from the left to view messages." />
            )}
          </div>
        </div>
      )}

      {composeOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111827]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[18px] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#111827]">New message</h2>
              <button onClick={() => setComposeOpen(false)} className="rounded-lg p-2 hover:bg-[#F8FAFC]">
                <X size={18} />
              </button>
            </div>
            {contactsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-[10px] bg-[#E5E7EB]" />
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-[#6B7280]">
                No contacts yet. Apply to adopt a pet or book a vet appointment to start chatting.
              </p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {contacts.map((contact) => {
                  const key = `${contact.participant_id}-${contact.pet_id ?? 'none'}-${contact.conversation_type}`
                  return (
                    <button
                      key={key}
                      onClick={() => void openContact(key)}
                      className="flex w-full items-center justify-between rounded-[12px] border border-[#E5E7EB] px-4 py-3 text-left hover:bg-[#F8FAFC]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">
                          {contact.participant_name}
                        </p>
                        <p className="text-xs text-[#6B7280]">{contact.context_label}</p>
                      </div>
                      <span className="rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[11px] font-medium capitalize text-[#16A34A]">
                        {contact.participant_role}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
            {composeError && (
              <p role="alert" className="mt-3 rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-600">
                {composeError}
              </p>
            )}
          </div>
        </div>
      )}

      {callNotice && (
        <div
          role="status"
          className="fixed right-5 top-5 z-[90] rounded-[12px] border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 shadow-lg"
        >
          {callNotice}
          <button
            onClick={() => setCallNotice('')}
            className="ml-3 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {sendError && (
        <div
          role="alert"
          className="fixed right-5 top-5 z-[90] rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-lg"
        >
          {sendError}
          <button
            onClick={() => setSendError('')}
            className="ml-3 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

function MessagesSkeleton() {
  return (
    <div className="flex h-[600px] overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
      <div className="w-72 space-y-3 border-r border-[#E5E7EB] p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-[10px] bg-[#E5E7EB]" />
        ))}
      </div>
      <div className="flex-1 space-y-3 p-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-12 w-1/2 animate-pulse rounded-[12px] bg-[#E5E7EB]" />
        ))}
      </div>
    </div>
  )
}

function Empty({
  title,
  text,
  action,
}: {
  title: string
  text: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-12 text-center">
      <MessageSquare className="mx-auto text-[#16A34A]" size={28} />
      <h3 className="mt-3 font-semibold text-[#111827]">{title}</h3>
      <p className="mt-1 text-sm text-[#6B7280]">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

function initialsFrom(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'PS'
}

function formatTime(value: string) {
  const date = new Date(value)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  return sameDay
    ? new Intl.DateTimeFormat('en', { timeStyle: 'short' }).format(date)
    : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}
