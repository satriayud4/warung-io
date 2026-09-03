import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { LogoutButton } from "@/components/layout/LogoutButton";

// Shared layout for every page that requires a logged-in user.
// The middleware already blocks unauthenticated requests, but we double
// check here too since Server Components should never trust that alone.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <div>
          <p className="font-bold text-brand-600">Warung.io</p>
          <p className="text-xs text-gray-500">{storeName}</p>
        </div>
        <LogoutButton className="text-sm font-medium text-gray-500" />
      </header>

      <div className="hidden justify-end border-b border-gray-200 bg-white px-6 py-3 md:flex">
        <LogoutButton className="text-sm font-medium text-gray-500 hover:text-gray-800" />
      </div>

      <main className="px-4 pb-24 pt-4 md:px-8 md:pb-8 md:pt-6">{children}</main>

      <BottomNav />
    </div>
  );
}
