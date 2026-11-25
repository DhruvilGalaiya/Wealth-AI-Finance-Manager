"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { serialize, serializeMany } from "@/lib/serialize";

export async function getAccountWithTransactions(accountId) {
  const user = await requireUser();

  const account = await db.account.findUnique({
    where: { id: accountId, userId: user.id },
    include: {
      transactions: { orderBy: { date: "desc" } },
      _count: { select: { transactions: true } },
    },
  });

  if (!account) return null;

  return {
    ...serialize(account),
    transactions: serializeMany(account.transactions),
  };
}

export async function bulkDeleteTransactions(transactionIds) {
  try {
    const user = await requireUser();
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      throw new Error("No transactions selected");
    }

    const transactions = await db.transaction.findMany({
      where: { id: { in: transactionIds }, userId: user.id },
    });

    // Deleting an expense gives money back; deleting income takes it away.
    const balanceChanges = {};
    for (const t of transactions) {
      const amount = t.amount.toNumber();
      const change = t.type === "EXPENSE" ? amount : -amount;
      balanceChanges[t.accountId] = (balanceChanges[t.accountId] || 0) + change;
    }

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { id: { in: transactions.map((t) => t.id) }, userId: user.id },
      });

      for (const [accountId, change] of Object.entries(balanceChanges)) {
        await tx.account.update({
          where: { id: accountId, userId: user.id },
          data: { balance: { increment: change } },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/account/[id]", "page");

    return { success: true, deleted: transactions.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateDefaultAccount(accountId) {
  try {
    const user = await requireUser();

    const account = await db.$transaction(async (tx) => {
      const target = await tx.account.findUnique({
        where: { id: accountId, userId: user.id },
      });
      if (!target) throw new Error("Account not found");

      await tx.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });

      return tx.account.update({
        where: { id: accountId },
        data: { isDefault: true },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/accounts");
    return { success: true, data: serialize(account) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
