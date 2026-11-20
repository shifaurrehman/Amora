jest.mock('../src/lib/supabase', () => ({ supabase: {} }));

import { supabase } from '../src/lib/supabase';
import {
  fetchMessages,
  getOrCreateConversation,
  mapMessageRow,
  orderConversationPair,
  sendMessage,
  subscribeToMessages,
} from '../src/services/supabase/chat';
import { createMockChannel, createMockClient } from './helpers/supabaseMock';

const USER_A = '11111111-1111-1111-1111-111111111111';
const USER_B = '22222222-2222-2222-2222-222222222222';

const messageRow = {
  id: 'msg-1',
  conversation_id: 'conv-1',
  sender_id: USER_B,
  text: 'Salam!',
  created_at: '2026-11-20T10:00:00.000Z',
};

describe('orderConversationPair', () => {
  it('orders the pair independently of argument order', () => {
    expect(orderConversationPair(USER_A, USER_B)).toEqual([USER_A, USER_B]);
    expect(orderConversationPair(USER_B, USER_A)).toEqual([USER_A, USER_B]);
  });

  it('rejects missing or equal participants', () => {
    expect(() => orderConversationPair('', USER_B)).toThrow();
    expect(() => orderConversationPair(USER_A, USER_A)).toThrow();
  });
});

describe('mapMessageRow', () => {
  it('maps schema columns to the chat message shape', () => {
    const mapped = mapMessageRow(messageRow);
    expect(mapped).toEqual({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: USER_B,
      text: 'Salam!',
      createdAt: new Date('2026-11-20T10:00:00.000Z'),
    });
  });
});

describe('getOrCreateConversation', () => {
  it('returns the existing conversation without inserting', async () => {
    const dedicated = createMockClient({
      tables: { conversations: { data: { id: 'conv-existing' }, error: null } },
    });
    Object.assign(supabase, dedicated.client);

    const id = await getOrCreateConversation(USER_A, USER_B);

    expect(id).toBe('conv-existing');
    expect(dedicated.tables.conversations.insert).not.toHaveBeenCalled();
    expect(dedicated.tables.conversations.eq).toHaveBeenCalledWith('participant_a', USER_A);
    expect(dedicated.tables.conversations.eq).toHaveBeenCalledWith('participant_b', USER_B);
  });

  it('creates the conversation when none exists', async () => {
    const dedicated = createMockClient({
      tables: {
        conversations: [
          { data: null, error: null }, // select miss
          { data: { id: 'conv-new' }, error: null }, // insert ... single()
        ],
      },
    });
    Object.assign(supabase, dedicated.client);

    const id = await getOrCreateConversation(USER_B, USER_A);

    expect(id).toBe('conv-new');
    expect(dedicated.tables.conversations.insert).toHaveBeenCalledWith({
      participant_a: USER_A,
      participant_b: USER_B,
    });
  });

  it('recovers when a concurrent insert wins the unique pair race', async () => {
    const dedicated = createMockClient({
      tables: {
        conversations: [
          { data: null, error: null }, // select miss
          { data: null, error: { code: '23505', message: 'duplicate key' } }, // insert loses race
          { data: { id: 'conv-raced' }, error: null }, // re-select
        ],
      },
    });
    Object.assign(supabase, dedicated.client);

    const id = await getOrCreateConversation(USER_A, USER_B);
    expect(id).toBe('conv-raced');
  });

  it('propagates unrelated insert errors', async () => {
    const dedicated = createMockClient({
      tables: {
        conversations: [
          { data: null, error: null },
          { data: null, error: { code: '42501', message: 'rls violation' } },
          { data: null, error: null }, // re-select after failed insert (still no row)
        ],
      },
    });
    Object.assign(supabase, dedicated.client);

    await expect(getOrCreateConversation(USER_A, USER_B)).rejects.toMatchObject({
      code: '42501',
      message: 'rls violation',
    });
  });
});

describe('fetchMessages', () => {
  it('loads messages newest-first and maps them', async () => {
    const dedicated = createMockClient({
      tables: { messages: { data: [messageRow], error: null } },
    });
    Object.assign(supabase, dedicated.client);

    const messages = await fetchMessages('conv-1');

    expect(dedicated.tables.messages.eq).toHaveBeenCalledWith('conversation_id', 'conv-1');
    expect(dedicated.tables.messages.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(messages).toHaveLength(1);
    expect(messages[0].id).toBe('msg-1');
  });
});

describe('sendMessage', () => {
  it('inserts a trimmed message and returns the stored row', async () => {
    const dedicated = createMockClient({
      tables: { messages: { data: messageRow, error: null } },
    });
    Object.assign(supabase, dedicated.client);

    const sent = await sendMessage('conv-1', USER_A, '  Salam!  ');

    expect(dedicated.tables.messages.insert).toHaveBeenCalledWith({
      conversation_id: 'conv-1',
      sender_id: USER_A,
      text: 'Salam!',
    });
    expect(sent.id).toBe('msg-1');
  });

  it('rejects blank messages client-side', async () => {
    const dedicated = createMockClient({ tables: { messages: { data: null, error: null } } });
    Object.assign(supabase, dedicated.client);

    await expect(sendMessage('conv-1', USER_A, '   ')).rejects.toThrow('empty');
    expect(dedicated.tables.messages.insert).not.toHaveBeenCalled();
  });
});

describe('subscribeToMessages', () => {
  it('listens only to inserts on public.messages for the conversation', () => {
    const channel = createMockChannel();
    Object.assign(supabase, createMockClient({ channel }).client);

    const onMessage = jest.fn();
    subscribeToMessages('conv-1', onMessage);

    expect(supabase.channel).toHaveBeenCalledWith('messages:conv-1');
    const [event, config, handler] = channel.on.mock.calls[0];
    expect(event).toBe('postgres_changes');
    expect(config).toEqual({
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: 'conversation_id=eq.conv-1',
    });

    handler({ new: messageRow });
    expect(onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'msg-1', conversationId: 'conv-1' }),
    );
    expect(channel.subscribe).toHaveBeenCalled();
  });
});
