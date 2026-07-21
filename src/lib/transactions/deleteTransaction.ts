import { prisma } from "@/lib/prisma";

/** Remove lançamento do utilizador; limpa plano de parcelas se ficar vazio. */
export async function deleteTransactionForUser(
  userId: string,
  transactionId: string
): Promise<boolean> {
  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { id: true, installmentPlanId: true },
  });
  if (!tx) return false;

  await prisma.$transaction(async (db) => {
    await db.transaction.delete({ where: { id: transactionId } });
    if (tx.installmentPlanId) {
      const remaining = await db.transaction.count({
        where: { installmentPlanId: tx.installmentPlanId },
      });
      if (remaining === 0) {
        await db.installmentPlan.delete({ where: { id: tx.installmentPlanId } });
      }
    }
  });

  return true;
}
