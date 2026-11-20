/**
 * Test helpers that replace the real Supabase client with deterministic
 * in-memory mocks. No network calls are made from unit tests.
 */

export interface MockResult {
  data?: any;
  error?: any;
}

export type MockQueryResult = MockResult | MockResult[];

export interface MockQuery {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  neq: jest.Mock;
  in: jest.Mock;
  gte: jest.Mock;
  lte: jest.Mock;
  order: jest.Mock;
  maybeSingle: jest.Mock;
  single: jest.Mock;
}

/**
 * Chainable query mock. Every method returns the query itself, and the query
 * is thenable, so both styles resolve with a result:
 *   await supabase.from('t').insert(row)
 *   await supabase.from('t').select('*').eq('a', 1).maybeSingle()
 * Pass an array of results to return a different one per await (e.g. a unique
 * violation first, then success).
 */
export function createMockQuery(result: MockQueryResult = { data: null, error: null }): MockQuery {
  const results: MockResult[] = Array.isArray(result) ? result : [result];
  let calls = 0;
  const nextResult = () => {
    const current = results[Math.min(calls, results.length - 1)];
    calls += 1;
    return Promise.resolve(current === undefined ? { data: null, error: null } : current);
  };

  const query: any = {};
  ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'gte', 'lte', 'order', 'maybeSingle', 'single'].forEach(
    (name) => {
      query[name] = jest.fn(() => query);
    },
  );

  // Thenable: `await query` resolves to the next queued result.
  query.then = (onFulfilled: any, onRejected: any) =>
    nextResult().then(onFulfilled, onRejected);

  return query as unknown as MockQuery;
}

export function createMockStorage() {
  const bucket: any = {
    upload: jest.fn(() => Promise.resolve({ data: { path: 'uploaded' }, error: null })),
    remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
    createSignedUrls: jest.fn(() => Promise.resolve({ data: [], error: null })),
  };
  return {
    from: jest.fn(() => bucket),
    __bucket: bucket,
  };
}

export function createMockChannel() {
  return {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn(),
  };
}

/**
 * Builds a mock `supabase` client with per-table query mocks and mock storage.
 * Use with: jest.mock('<path to lib/supabase>', () => ({ supabase: client }))
 */
export function createMockClient(options?: {
  tables?: Record<string, MockQuery | MockQueryResult>;
  storage?: ReturnType<typeof createMockStorage>;
  channel?: any;
}) {
  const tables: Record<string, MockQuery> = {};
  Object.entries(options?.tables || {}).forEach(([table, result]) => {
    tables[table] =
      result && typeof (result as MockQuery).select === 'function'
        ? (result as MockQuery)
        : createMockQuery(result as MockQueryResult);
  });

  const storage = options?.storage || createMockStorage();
  const channel = options?.channel || createMockChannel();

  const client: any = {
    from: jest.fn((table: string) => tables[table] || createMockQuery({ data: null, error: null })),
    storage,
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({ data: { user: { id: 'auth-user-id' } }, error: null }),
      ),
    },
    channel: jest.fn(() => channel),
    removeChannel: jest.fn(),
  };

  return { client, tables, storage, channel };
}
