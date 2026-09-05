import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Root URL just routes people to the right place based on session state.
// Uses getSession() (reads the cookie locally, no network round-trip) since
// this is just a routing decision, not a security gate — middleware and the
// (app) layout are what actually enforce authentication.
export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  redirect(session ? "/dashboard" : "/login");
}
