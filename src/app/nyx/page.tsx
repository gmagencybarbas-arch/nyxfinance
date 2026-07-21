import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/layout/AppNav";
import { NyxPage } from "@/components/nyx";
import { redirect } from "next/navigation";

export default async function NyxHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?gate=1&next=/nyx");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed !== true) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-[var(--background)] bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(17,17,24,0.95),transparent)]">
      <AppNav userEmail={user.email ?? undefined} />
      <NyxPage />
    </div>
  );
}
