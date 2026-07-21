"use client";

import { AppNav } from "@/components/layout/AppNav";
import { Container } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { StoreShowcase } from "./StoreShowcase";

export function StorePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <AppNav userEmail={user?.email ?? undefined} />
      <main className="py-6 pb-28 md:pb-10">
        <Container size="lg" className="space-y-6">
          <header className="space-y-1.5 px-0.5">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
              Escolha sua companhia
            </h1>
            <p className="max-w-xl text-sm text-[var(--muted-foreground)]">
              Personalidades diferentes. O mesmo cuidado com seu dinheiro.
            </p>
          </header>
          <StoreShowcase />
        </Container>
      </main>
    </div>
  );
}
