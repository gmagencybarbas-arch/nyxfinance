/** Cliente: atualiza lançamento por id. */
export async function updateTransactionClient(
  id: string,
  patch: {
    description?: string | null;
    status?: "PENDING" | "COMPLETED" | "CANCELED";
    amount?: number;
    category?: string;
    occurredAt?: string;
  }
): Promise<void> {
  const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Não foi possível atualizar");
  }
}
