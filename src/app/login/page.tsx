"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Container, Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";
import { useToast } from "@/contexts/ToastContext";

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const sneaky = searchParams.get("gate") === "1";
  const nextPath = safeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    toast.show("Bem-vindo de volta!", "success");
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser?.id) {
      await fetch("/api/auth/bootstrap", { method: "POST" }).catch(() => null);
      if (nextPath) {
        router.push(nextPath);
        router.refresh();
        return;
      }
      const profileRes = await fetch("/api/profile");
      const profile = profileRes.ok ? ((await profileRes.json()) as { onboardingCompleted?: boolean }) : null;
      router.push(profile?.onboardingCompleted ? "/nyx" : "/onboarding");
    } else {
      router.push("/onboarding");
    }
    router.refresh();
  }

  async function handleForgotSubmit() {
    setForgotError(null);
    setTemporaryPassword(null);
    const mail = email.trim();
    if (!mail) {
      setForgotError("Informe seu e-mail acima ou preencha o campo.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mail }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        temporaryPassword?: string;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        setForgotError(data.error ?? "Não foi possível redefinir a senha.");
        return;
      }
      if (data.temporaryPassword) {
        setTemporaryPassword(data.temporaryPassword);
        toast.show("Senha temporária gerada. Copie e faça login.", "success");
      }
    } catch {
      setForgotError("Erro de rede. Tente de novo.");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Container size="sm">
        {sneaky && (
          <div className="mb-4 rounded-2xl border border-[var(--nyx-gradient-start)]/30 bg-[var(--nyx-gradient-start)]/10 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-sm font-medium leading-relaxed text-[var(--foreground)]">
              hehehe, tentando entrar sem se identificar? Qual é, loga aí…
            </p>
          </div>
        )}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Entrar no Mini-Nyx</CardTitle>
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
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">
                    Senha
                  </label>
                  <button
                    type="button"
                    className="text-xs text-[var(--primary)] hover:underline"
                    onClick={() => {
                      setShowForgot((v) => !v);
                      setForgotError(null);
                      setTemporaryPassword(null);
                    }}
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              {showForgot && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4 space-y-3">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Digite o mesmo e-mail da sua conta. Geramos uma senha temporária (3 letras + 3 números)
                    para você entrar agora.
                  </p>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth
                      loading={forgotLoading}
                      disabled={forgotLoading}
                      onClick={() => void handleForgotSubmit()}
                    >
                      {forgotLoading ? "Gerando…" : "Gerar senha temporária"}
                    </Button>
                  </div>
                  {forgotError && (
                    <p className="text-sm text-amber-400/90" role="alert">
                      {forgotError}
                    </p>
                  )}
                  {temporaryPassword && (
                    <div className="rounded-md bg-[var(--background)] border border-[var(--border)] p-3 space-y-2">
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Sua senha temporária (copie e cole no campo Senha):
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-lg font-mono tracking-wide font-semibold text-[var(--foreground)]">
                          {temporaryPassword}
                        </code>
                        <Button
                          type="button"
                          variant="secondary"
                          className="text-xs shrink-0"
                          onClick={() => {
                            void navigator.clipboard.writeText(temporaryPassword);
                            toast.show("Copiado!", "success");
                          }}
                        >
                          Copiar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {error && (
                <p className="text-sm text-amber-400/90" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" fullWidth loading={loading} disabled={loading}>
                {loading ? "Entrando…" : "Entrar"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
              Não tem conta?{" "}
              <Link href="/register" className="text-[var(--primary)] hover:underline">
                Cadastre-se
              </Link>
            </p>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 text-sm text-[var(--muted-foreground)]">
          Carregando…
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
