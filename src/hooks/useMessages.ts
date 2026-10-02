import { useCallback, useEffect, useRef, useState } from 'react'

import {
  createConversation,
  getConversationMessages,
  getMessageContacts,
  getUserConversations,
  markConversationRead,
  sendMessage,
  subscribeToConversation,
  subscribeToInbox,
  type ChatMessage,
  type ConversationSummary,
  type ConversationType,
  type MessageContact,
  type MessageInsertPayload,
} from '@/services/messages'

function byCreatedAt(a: ChatMessage, b: ChatMessage) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
}

export function useUserConversations(userId?: string | null) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [readVersion, setReadVersion] = useState(0)

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      setConversations(await getUserConversations())
    } catch (loadError) {
      if (!silent) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load conversations.',
        )
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const markRead = useCallback((conversationId: string) => {
    const readAt = new Date().toISOString()
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unread: false, last_read_at: readAt }
          : conversation,
      ),
    )
    setReadVersion((value) => value + 1)
    void markConversationRead(conversationId).catch((readError) => {
      console.warn('[PawSphere] Unable to persist conversation read state:', readError)
    })
  }, [])

  const updateConversationLastMessage = useCallback(
    (
      conversationId: string,
      content: string,
      timestamp: string,
      senderId?: string,
    ) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === conversationId)
        if (index === -1) return prev
        const incoming = Boolean(senderId && senderId !== userId)
        const updatedItem: ConversationSummary = {
          ...prev[index],
          last_message: content,
          last_message_at: timestamp,
          last_sender_id: senderId ?? prev[index].last_sender_id,
          updated_at: timestamp,
          unread: incoming ? true : prev[index].unread,
        }
        return [updatedItem, ...prev.filter((_, i) => i !== index)]
      })
    },
    [userId],
  )

  // Sorted id list keeps the subscription stable while only message content changes.
  const conversationKey = conversations
    .map((conversation) => conversation.id)
    .sort()
    .join(',')

  useEffect(() => {
    if (!userId) return

    const unsubscribe = subscribeToInbox(
      {
        userId,
        conversationIds: conversationKey ? conversationKey.split(',') : [],
      },
      {
        onMessage: (message) => {
          updateConversationLastMessage(
            message.conversation_id,
            message.content,
            message.created_at,
            message.sender_id,
          )
        },
        onConversation: () => {
          void refresh(true)
        },
        onRead: (read) => {
          setConversations((prev) =>
            prev.map((conversation) => {
              if (conversation.id !== read.conversation_id) return conversation
              const lastAt = conversation.last_message_at
              const stillUnread = Boolean(
                lastAt &&
                  conversation.last_sender_id &&
                  conversation.last_sender_id !== userId &&
                  new Date(lastAt) > new Date(read.last_read_at),
              )
              return {
                ...conversation,
                last_read_at: read.last_read_at,
                unread: stillUnread,
              }
            }),
          )
        },
      },
    )

    return unsubscribe
  }, [conversationKey, refresh, updateConversationLastMessage, userId])

  return {
    conversations,
    loading,
    error,
    refresh,
    markRead,
    readVersion,
    updateConversationLastMessage,
  }
}

export interface UseConversationMessagesOptions {
  onNewMessage?: (message: ChatMessage) => void
}

export function useConversationMessages(
  conversationId: string | null,
  options?: UseConversationMessagesOptions,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const optionsRef = useRef(options)
  optionsRef.current = options

  const refresh = useCallback(async () => {
    if (!conversationId) {
      setMessages([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const history = await getConversationMessages(conversationId)
      setMessages(history)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load messages.',
      )
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    // 1. Initial historical message load
    getConversationMessages(conversationId)
      .then((history) => {
        if (isMounted) {
          setMessages(history)
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load messages.',
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    // 2. Subscribe to Realtime INSERT events scoped to conversationId
    const unsubscribe = subscribeToConversation(
      conversationId,
      (newRow: MessageInsertPayload) => {
        if (!isMounted) return

        const newMsg: ChatMessage = {
          id: newRow.id,
          conversation_id: newRow.conversation_id,
          sender_id: newRow.sender_id,
          content: newRow.content,
          created_at: newRow.created_at,
          sender_name: '',
        }

        // STEP 3: Deduplicate by message ID & maintain chronological order
        setMessages((prev) => {
          const existing = prev.findIndex((m) => m.id === newMsg.id)
          // An optimistic copy is already shown: keep its resolved sender name
          // but adopt the database timestamp so ordering matches the server.
          const next =
            existing === -1
              ? [...prev, newMsg]
              : prev.map((m, index) =>
                  index === existing
                    ? { ...newMsg, sender_name: m.sender_name }
                    : m,
                )
          return next.sort(byCreatedAt)
        })

        // Notify listener (e.g. to update conversation list)
        optionsRef.current?.onNewMessage?.(newMsg)
      },
      (channelErr) => {
        // STEP 8: Realtime connection failure shouldn't crash app or clear messages
        console.warn(
          `[PawSphere Realtime] Channel notice for ${conversationId}:`,
          channelErr,
        )
      },
    )

    // STEP 4: Cleanup subscription when conversation changes or component unmounts
    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [conversationId])

  const send = useCallback(
    async (content: string, senderId?: string) => {
      if (!conversationId) throw new Error('Select a conversation first.')
      const newId = await sendMessage(conversationId, content)

      // Optimistic append if senderId is provided; deduplication by id ensures no duplicates
      if (senderId) {
        const optimisticMsg: ChatMessage = {
          id: newId,
          conversation_id: conversationId,
          sender_id: senderId,
          content: content.trim(),
          created_at: new Date().toISOString(),
          sender_name: '',
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === newId)) return prev
          return [...prev, optimisticMsg].sort(byCreatedAt)
        })
      }

      return newId
    },
    [conversationId],
  )

  return { messages, loading, error, refresh, send }
}

export function useMessageContacts() {
  const [contacts, setContacts] = useState<MessageContact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void getMessageContacts()
      .then((data) => {
        if (active) setContacts(data)
      })
      .catch(() => {
        if (active) setContacts([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const startConversation = useCallback(
    async (contact: MessageContact) => {
      return createConversation({
        type: contact.conversation_type as ConversationType,
        participantId: contact.participant_id,
        petId: contact.pet_id,
      })
    },
    [],
  )

  return { contacts, loading, startConversation }
}
