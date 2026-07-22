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
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--background)] bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(17,17,24,0.95),transparent)] md:h-auto md:min-h-screen md:overflow-visible">
      <AppNav userEmail={user.email ?? undefined} />
      <div className="min-h-0 flex-1 md:contents">
        <NyxPage />
      </div>
    </div>
  );
}
