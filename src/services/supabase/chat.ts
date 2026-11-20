import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

const UNIQUE_VIOLATION_CODE = '23505';

export interface ConversationRow {
  id: string;
  participant_a: string;
  participant_b: string;
  created_at: string;
}

export interface ChatMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: Date;
}

/**
 * The schema orders each pair deterministically (participant_a < participant_b
 * with a unique pair constraint), so both clients compute the same row.
 */
export function orderConversationPair(
  firstUserId: string,
  secondUserId: string,
): [string, string] {
  if (!firstUserId || !secondUserId) {
    throw new Error('Two distinct users are required for a conversation.');
  }
  if (firstUserId === secondUserId) {
    throw new Error('A conversation requires two different users.');
  }
  return firstUserId < secondUserId
    ? [firstUserId, secondUserId]
    : [secondUserId, firstUserId];
}

export function mapMessageRow(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    text: row.text,
    createdAt: new Date(row.created_at),
  };
}

export async function getOrCreateConversation(
  myUserId: string,
  otherUserId: string,
): Promise<string> {
  const [participantA, participantB] = orderConversationPair(myUserId, otherUserId);

  const selectExisting = async (): Promise<string | null> => {
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('participant_a', participantA)
      .eq('participant_b', participantB)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data?.id ?? null;
  };

  const existingId = await selectExisting();
  if (existingId) {
    return existingId;
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({ participant_a: participantA, participant_b: participantB })
    .select('id')
    .single();
  if (error && error.code === UNIQUE_VIOLATION_CODE) {
    // Another participant created the conversation concurrently.
    const racedId = await selectExisting();
    if (racedId) {
      return racedId;
    }
  }
  if (error) {
    throw error;
  }
  if (!data?.id) {
    throw new Error('Supabase did not return the conversation id.');
  }
  return data.id;
}

/** Newest-first order, ready for the chat UI. */
export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, text, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  return ((data || []) as ChatMessageRow[]).map(mapMessageRow);
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
): Promise<ChatMessage> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Cannot send an empty message.');
  }
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, text: trimmed })
    .select('id, conversation_id, sender_id, text, created_at')
    .single();
  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error('Supabase did not return the sent message.');
  }
  return mapMessageRow(data as ChatMessageRow);
}

/**
 * Realtime is limited to the single table in the supabase_realtime
 * publication (`public.messages`) and filtered to this conversation.
 */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: ChatMessage) => void,
  onError?: (error: Error) => void,
): RealtimeChannel {
  return supabase
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
        onMessage(mapMessageRow(payload.new as ChatMessageRow));
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' && onError) {
        onError(new Error('Chat realtime connection failed.'));
      }
    });
}

export function unsubscribeChannel(channel: RealtimeChannel | null): void {
  if (channel) {
    supabase.removeChannel(channel);
  }
}
