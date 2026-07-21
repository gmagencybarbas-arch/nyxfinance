import { AppNav } from "@/components/layout/AppNav";
import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "./DashboardContent";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadata = user?.user_metadata;
  const userName = metadata?.full_name ?? metadata?.name ?? user?.email?.split("@")[0] ?? null;
  const userAvatarUrl = metadata?.avatar_url ?? null;

  return (
    <div className="min-h-screen">
      <AppNav userEmail={user?.email ?? undefined} />
      <DashboardContent userName={userName} userAvatarUrl={userAvatarUrl} />
    </div>
  );
}
