"use server";

import { db } from "@/lib/prisma";
import { subDays } from "date-fns";
import { requireUser } from "@/lib/auth";

// Realistic-ish demo data: monthly salary, fixed bills and day-to-day spend.
const DAILY_SPEND = [
  { category: "groceries", range: [20, 90], chance: 0.35, label: "Grocery run" },
  { category: "food", range: [8, 45], chance: 0.5, label: "Lunch out" },
  { category: "transportation", range: [5, 40], chance: 0.3, label: "Transit" },
  { category: "shopping", range: [15, 150], chance: 0.12, label: "Online order" },
  { category: "entertainment", range: [10, 60], chance: 0.1, label: "Movies & events" },
  { category: "personal", range: [10, 50], chance: 0.06, label: "Personal care" },
  { category: "healthcare", range: [20, 200], chance: 0.03, label: "Pharmacy" },
];

const MONTHLY = [
  { day: 1, type: "INCOME", category: "salary", range: [4800, 5200], label: "Salary" },
  { day: 3, type: "EXPENSE", category: "housing", range: [1450, 1450], label: "Rent" },
  { day: 8, type: "EXPENSE", category: "utilities", range: [90, 160], label: "Electricity & water" },
  { day: 12, type: "EXPENSE", category: "bills", range: [45, 45], label: "Internet" },
  { day: 15, type: "EXPENSE", category: "insurance", range: [120, 120], label: "Health insurance" },
  { day: 18, type: "INCOME", category: "freelance", range: [300, 1200], label: "Freelance project", chance: 0.6 },
  { day: 20, type: "EXPENSE", category: "entertainment", range: [15.99, 15.99], label: "Streaming subscription" },
];

const rand = ([min, max]) => Number((Math.random() * (max - min) + min).toFixed(2));

export async function seedTransactions() {
  const user = await requireUser();

  const account = await db.account.findFirst({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  if (!account) {
    return { success: false, error: "Create an account first, then seed it." };
  }

  const transactions = [];
  let net = 0;
  const push = (date, type, category, amount, description) => {
    transactions.push({
      type,
      amount,
      description,
      date,
      category,
      status: "COMPLETED",
      userId: user.id,
      accountId: account.id,
    });
    net += type === "INCOME" ? amount : -amount;
  };

  for (let i = 180; i >= 0; i--) {
    const date = subDays(new Date(), i);
    for (const m of MONTHLY) {
      if (date.getDate() === m.day && Math.random() < (m.chance ?? 1)) {
        push(date, m.type, m.category, rand(m.range), m.label);
      }
    }
    for (const d of DAILY_SPEND) {
      if (Math.random() < d.chance) push(date, "EXPENSE", d.category, rand(d.range), d.label);
    }
  }

  const opening = 4000;
  await db.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { accountId: account.id, userId: user.id } });
    await tx.transaction.createMany({ data: transactions });
    await tx.account.update({
      where: { id: account.id },
      data: { balance: Number((opening + net).toFixed(2)) },
    });
  });

  return {
    success: true,
    message: `Created ${transactions.length} transactions in "${account.name}"`,
  };
}
