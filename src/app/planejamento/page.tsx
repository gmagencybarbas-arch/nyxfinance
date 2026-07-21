import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/layout/AppNav";
import { Container } from "@/components/ui";
import { PlanningContent } from "@/components/planning";
import { JourneyOpenPlanningBeacon } from "@/components/journey/JourneyOpenPlanningBeacon";

export const metadata = {
  title: "Planejamento | Nyx",
  description: "Visão mensal e projeção da sua vida financeira",
};

export default async function PlanejamentoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <AppNav userEmail={user?.email ?? undefined} />
      {user ? <JourneyOpenPlanningBeacon /> : null}
      <main className="py-6 pb-24 md:pb-8">
        <Container size="lg">
          <PlanningContent />
        </Container>
      </main>
    </div>
  );
}
