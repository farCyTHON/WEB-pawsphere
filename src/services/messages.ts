import { getCurrentUser } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'

export type ConversationType = 'owner_shelter' | 'owner_vet'

export interface ConversationSummary {
  id: string
  conversation_type: ConversationType
  owner_id: string
  participant_id: string
  pet_id: string | null
  appointment_id: string | null
  created_at: string
  updated_at: string
  other_user_id: string
  other_user_name: string
  other_user_role: string
  pet_name: string | null
  last_message: string | null
  last_message_at: string | null
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender_name: string
}

export interface MessageContact {
  participant_id: string
  participant_name: string
  participant_role: string
  conversation_type: ConversationType
  pet_id: string | null
  pet_name: string | null
  context_label: string
}

const READ_STORAGE_KEY = 'pawsphere.conversationReads'

function readMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export async function createConversation(input: {
  type: ConversationType
  participantId: string
  petId?: string | null
  appointmentId?: string | null
}): Promise<string> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Sign in to start a conversation.')

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  // Determine resolved owner and participant IDs based on user's role
  const isOwner = myProfile?.role === 'owner'
  const resolvedOwnerId = isOwner ? user.id : input.participantId
  const resolvedParticipantId = isOwner ? input.participantId : user.id

  // 1. Check if conversation already exists
  let query = supabase
    .from('conversations')
    .select('id')
    .eq('conversation_type', input.type)
    .eq('owner_id', resolvedOwnerId)
    .eq('participant_id', resolvedParticipantId)

  if (input.petId) {
    query = query.eq('pet_id', input.petId)
  }

  const { data: existingConvs } = await query.limit(1)
  if (existingConvs && existingConvs.length > 0) {
    return existingConvs[0].id
  }

  // 2. Direct insert (secured by conversation_members_insert RLS policy & can_start_conversation check)
  const insertPayload: Record<string, unknown> = {
    conversation_type: input.type,
    owner_id: resolvedOwnerId,
    participant_id: resolvedParticipantId,
    pet_id: input.petId || null,
    appointment_id: input.appointmentId || null,
  }

  const { data: insertedConv, error: insertErr } = await supabase
    .from('conversations')
    .insert(insertPayload)
    .select('id')
    .single()

  if (insertedConv?.id) {
    return insertedConv.id
  }

  // 3. Fallback to RPC create_conversation if direct insert fails
  const { data, error } = await supabase.rpc('create_conversation', {
    target_type: input.type,
    target_participant_id: input.participantId,
    target_pet_id: input.petId || null,
    target_appointment_id: input.appointmentId || null,
  })

  if (error) {
    console.error('[PawSphere createConversation] Error:', {
      rpcError: error.message,
      insertError: insertErr?.message,
      input,
    })
    throw new Error(insertErr?.message || error.message)
  }
  return data as string
}

export async function getUserConversations(): Promise<ConversationSummary[]> {
  const { data, error } = await supabase.rpc('get_user_conversations')
  if (error) throw error
  return (data ?? []) as ConversationSummary[]
}

export async function getConversationMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase.rpc('get_conversation_messages', {
    target_conversation_id: conversationId,
  })
  if (error) throw error
  return (data ?? []) as ChatMessage[]
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<string> {
  if (!content.trim()) throw new Error('Message cannot be empty.')

  const { data, error } = await supabase.rpc('send_message', {
    target_conversation_id: conversationId,
    message_content: content.trim(),
  })

  if (error) throw error
  return data as string
}

export async function getMessageContacts(): Promise<MessageContact[]> {
  const { data, error } = await supabase.rpc('get_message_contacts')
  if (error) throw error
  return (data ?? []) as MessageContact[]
}

/** Frontend-only unread tracking via localStorage. */
export function markConversationRead(conversationId: string): void {
  const map = readMap()
  map[conversationId] = new Date().toISOString()
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(map))
}

export function isConversationUnread(
  conversation: ConversationSummary,
): boolean {
  if (!conversation.last_message_at) return false
  const map = readMap()
  const lastRead = map[conversation.id]
  if (!lastRead) return true
  return new Date(conversation.last_message_at) > new Date(lastRead)
}

export interface MessageInsertPayload {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

/**
 * Subscribes to new message INSERT events for a single conversation.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToConversation(
  conversationId: string,
  onInsert: (message: MessageInsertPayload) => void,
  onError?: (error: unknown) => void,
): () => void {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          onInsert(payload.new as MessageInsertPayload)
        }
      },
    )
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn(`[PawSphere Realtime] Channel error for conversation ${conversationId}:`, error)
        if (onError) onError(error)
      }
    })

  return () => {
    void supabase.removeChannel(channel)
  }
}
