import { useCallback, useEffect, useRef, useState } from 'react'

import {
  createConversation,
  getConversationMessages,
  getMessageContacts,
  getUserConversations,
  isConversationUnread,
  markConversationRead,
  sendMessage,
  subscribeToConversation,
  type ChatMessage,
  type ConversationSummary,
  type ConversationType,
  type MessageContact,
  type MessageInsertPayload,
} from '@/services/messages'

export function useUserConversations() {
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
    markConversationRead(conversationId)
    setReadVersion((value) => value + 1)
  }, [])

  const updateConversationLastMessage = useCallback(
    (conversationId: string, content: string, timestamp: string) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === conversationId)
        if (index === -1) return prev
        const updatedItem: ConversationSummary = {
          ...prev[index],
          last_message: content,
          last_message_at: timestamp,
          updated_at: timestamp,
        }
        return [updatedItem, ...prev.filter((_, i) => i !== index)]
      })
    },
    [],
  )

  const withUnread = conversations.map((conversation) => ({
    ...conversation,
    unread: isConversationUnread(conversation),
  }))

  return {
    conversations: withUnread,
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
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev
          }
          const next = [...prev, newMsg]
          next.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          )
          return next
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
          const next = [...prev, optimisticMsg]
          next.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          )
          return next
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
