import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/layout/AppNav";
import { Container } from "@/components/ui";
import { JourneyPage } from "@/components/journey/JourneyPage";

export const metadata = {
  title: "Jornada | Nyx",
  description: "Missões, progresso e recompensas da Nyx",
};

export default async function JornadaRoutePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/jornada");
  }

  return (
    <div className="min-h-screen">
      <AppNav userEmail={user.email ?? undefined} />
      <main className="py-6 pb-28 md:pb-12">
        <Container size="full">
          <JourneyPage />
        </Container>
      </main>
    </div>
  );
}
