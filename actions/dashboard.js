"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { serialize, serializeMany } from "@/lib/serialize";
import { accountSchema } from "@/app/lib/schema";

export async function getUserAccounts() {
  const user = await requireUser();

  const accounts = await db.account.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { transactions: true } } },
  });

  return serializeMany(accounts);
}

export async function createAccount(data) {
  const user = await requireUser();
  await enforceRateLimit(user.clerkUserId);

  const parsed = accountSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid account details");
  }
  const { name, type, balance, isDefault } = parsed.data;

  const account = await db.$transaction(async (tx) => {
    const existing = await tx.account.count({ where: { userId: user.id } });
    // The first account is always the default.
    const shouldBeDefault = existing === 0 ? true : Boolean(isDefault);

    if (shouldBeDefault) {
      await tx.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.account.create({
      data: {
        name: name.trim(),
        type,
        balance: Number(balance),
        isDefault: shouldBeDefault,
        userId: user.id,
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  return { success: true, data: serialize(account) };
}

// Last 12 months of transactions across all accounts, newest first.
export async function getDashboardData() {
  const user = await requireUser();

  const since = new Date();
  since.setMonth(since.getMonth() - 12);

  const transactions = await db.transaction.findMany({
    where: { userId: user.id, date: { gte: since } },
    orderBy: { date: "desc" },
  });

  return serializeMany(transactions);
}
