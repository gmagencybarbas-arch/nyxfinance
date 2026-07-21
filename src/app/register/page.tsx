"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Container, Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    toast.show("Verifique seu e-mail para confirmar o cadastro.", "success");
    // Não redireciona: lead precisa clicar no link do e-mail; após verificar, o auth/callback envia para /onboarding
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Container size="sm">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Criar conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="E-mail"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />
              <Input
                label="Senha"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
              />
              {error && (
                <p className="text-sm text-amber-400/90" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" fullWidth loading={loading} disabled={loading}>
                {loading ? "Cadastrando…" : "Cadastrar"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
              Já tem conta?{" "}
              <Link href="/login" className="text-[var(--primary)] hover:underline">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
