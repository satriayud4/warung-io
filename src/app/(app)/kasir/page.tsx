import { createClient } from "@/lib/supabase/server";
import { TransactionEditor } from "@/components/kasir/TransactionEditor";

export const dynamic = "force-dynamic";

export default async function KasirPage() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, selling_price, unit")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return <TransactionEditor products={products ?? []} />;
}
