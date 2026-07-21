"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui";

export function ProfileActions() {
  const router = useRouter();
  const { signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="pt-2">
      <Button variant="danger" size="md" onClick={handleSignOut}>
        Sair da conta
      </Button>
    </div>
  );
}
