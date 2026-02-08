import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

// Mock client for SSR/build time when env vars are not available
const createMockClient = (): SupabaseClient => {
  const mockQuery = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    eq: () => mockQuery,
    order: () => mockQuery,
    gte: () => mockQuery,
    lte: () => mockQuery,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: (value: { data: null | never[]; error: null }) => void) =>
      resolve({ data: [], error: null }),
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => mockQuery,
    rpc: async () => ({ data: [], error: null }),
  } as unknown as SupabaseClient;
};

export function createClient(): SupabaseClient {
  // During SSR/build, return mock client
  if (typeof window === 'undefined') {
    return createMockClient();
  }

  // Return cached client if available
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars not available on client, return mock
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured');
    return createMockClient();
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
