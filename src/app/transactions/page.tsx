import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/layout/AppNav";
import { Container } from "@/components/ui";
import { FinancialControlCenter } from "@/components/transactions";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <AppNav userEmail={user?.email ?? undefined} />
      <main className="py-6 pb-24 md:pb-8">
        <Container size="sm" className="space-y-6">
          <FinancialControlCenter />
        </Container>
      </main>
    </div>
  );
}
