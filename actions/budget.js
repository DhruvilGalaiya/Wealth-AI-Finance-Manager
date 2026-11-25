"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { monthRange } from "@/lib/finance";

export async function getCurrentBudget(accountId) {
  const user = await requireUser();

  const budget = await db.budget.findUnique({ where: { userId: user.id } });

  const { start, end } = monthRange();
  const expenses = await db.transaction.aggregate({
    where: {
      userId: user.id,
      type: "EXPENSE",
      date: { gte: start, lt: end },
      ...(accountId ? { accountId } : {}),
    },
    _sum: { amount: true },
  });

  return {
    budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
    currentExpenses: expenses._sum.amount ? expenses._sum.amount.toNumber() : 0,
  };
}

export async function updateBudget(amount) {
  try {
    const user = await requireUser();

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > 1e9) {
      throw new Error("Please enter a valid budget amount");
    }

    const budget = await db.budget.upsert({
      where: { userId: user.id },
      update: { amount: value },
      create: { userId: user.id, amount: value },
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
