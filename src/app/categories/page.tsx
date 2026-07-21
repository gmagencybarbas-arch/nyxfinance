import { Container, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { AppNav } from "@/components/layout/AppNav";
import { createClient } from "@/lib/supabase/server";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <AppNav userEmail={user?.email ?? undefined} />
      <main className="py-6 pb-24 md:pb-8">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)]">
                Gerencie categorias de receitas e despesas. (CRUD e listagem em breve.)
              </p>
            </CardContent>
          </Card>
        </Container>
      </main>
    </div>
  );
}
