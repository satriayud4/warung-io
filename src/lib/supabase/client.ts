"use client";

import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase client. Uses the public anon key only.
// All queries made with this client are subject to Row Level Security (RLS),
// so a logged-in user can only ever see/change their own data.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
