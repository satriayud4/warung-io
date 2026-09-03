import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Root URL just routes people to the right place based on session state.
export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
