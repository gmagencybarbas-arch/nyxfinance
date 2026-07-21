/** Cliente: exclui lançamento por id. */
export async function deleteTransactionClient(id: string): Promise<void> {
  const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Não foi possível excluir");
  }
}
