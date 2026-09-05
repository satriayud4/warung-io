import { createClient } from "@/lib/supabase/server";
import { StoreSettingsForm } from "./StoreSettingsForm";
import { ProfileForm } from "./ProfileForm";

export default async function PengaturanPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session!.user;

  const { data: settings } = await supabase
    .from("store_settings")
    .select("store_name, owner_name, phone, currency")
    .eq("id", true)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-lg font-semibold">Pengaturan</h1>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-1 text-sm font-semibold text-gray-800">Info Warung</h2>
        <p className="mb-4 text-xs text-gray-500">
          Data ini dibagi untuk semua akun yang login — mengubahnya di sini akan terlihat
          oleh semua orang.
        </p>
        <StoreSettingsForm
          initial={{
            store_name: settings?.store_name ?? "",
            owner_name: settings?.owner_name ?? "",
            phone: settings?.phone ?? "",
            currency: settings?.currency ?? "IDR",
          }}
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-1 text-sm font-semibold text-gray-800">Akun Saya</h2>
        <p className="mb-4 text-xs text-gray-500">{user!.email}</p>
        <ProfileForm initial={{ name: profile?.name ?? "" }} />
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
        Backup/export data (Excel, CSV, dan gambar untuk laporan harian) sudah tersedia di
        halaman Laporan.
      </div>
    </div>
  );
}
