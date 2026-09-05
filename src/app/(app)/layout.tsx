import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { LogoutButton } from "@/components/layout/LogoutButton";

// Shared layout for every page that requires a logged-in user.
// The middleware already validates the session with Supabase's Auth server
// (network round-trip) and redirects unauthenticated requests before this
// layout ever runs. Re-checking with getUser() here would mean paying that
// same network cost a second time on every single navigation, so we read
// the already-validated session locally from the cookie instead — this is
// a defense-in-depth fallback, not the actual security boundary.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect("/login");
  }

  const { data: settings } = await supabase
    .from("store_settings")
    .select("store_name")
    .eq("id", true)
    .single();

  const storeName = settings?.store_name || "Warung Saya";

  return (
    <div className="min-h-screen md:pl-60">
      <Sidebar storeName={storeName} />

      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:hidden">
        <div className="min-w-0">
          <p className="font-bold text-brand-600">Warung.io</p>
          <p className="truncate text-xs text-gray-500">{storeName}</p>
        </div>
        <LogoutButton className="shrink-0 text-sm font-medium text-gray-500" />
      </header>

      <div className="hidden justify-end border-b border-gray-200 bg-white px-6 py-3 md:flex">
        <LogoutButton className="text-sm font-medium text-gray-500 hover:text-gray-800" />
      </div>

      <main className="px-4 pb-24 pt-4 md:px-8 md:pb-8 md:pt-6">{children}</main>

      <BottomNav />
    </div>
  );
}
