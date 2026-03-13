import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 데모 모드: Supabase 미설정 시 null 반환
  if (!url || url === 'your_supabase_url_here' || !key || key === 'your_supabase_anon_key_here') {
    return null;
  }

  if (!client) {
    client = createBrowserClient(url, key);
  }
  return client;
}
