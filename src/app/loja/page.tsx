import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StorePage } from "@/components/store/StorePage";

export default async function LojaRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/loja");
  }

  return <StorePage />;
}
