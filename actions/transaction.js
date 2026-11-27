"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { serialize, serializeMany } from "@/lib/serialize";
import { nextRecurringDate } from "@/lib/recurring";
import { transactionInputSchema } from "@/app/lib/schema";
import { defaultCategories } from "@/data/categories";
import { categorize, isIncomeCategory } from "@/lib/rules";
import { parseQuickAdd } from "@/lib/quick-add";

const signed = (type, amount) => (type === "EXPENSE" ? -amount : amount);

function parseInput(data) {
  const parsed = transactionInputSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid transaction");
  }
  const input = parsed.data;
  const isRecurring = input.isRecurring && Boolean(input.recurringInterval);
  return {
    type: input.type,
    amount: input.amount,
    description: input.description?.trim() || null,
    date: input.date,
    accountId: input.accountId,
    category: input.category,
    isRecurring,
    recurringInterval: isRecurring ? input.recurringInterval : null,
    nextRecurringDate: isRecurring
      ? nextRecurringDate(input.date, input.recurringInterval)
      : null,
  };
}

async function assertAccountOwned(tx, accountId, userId) {
  const account = await tx.account.findUnique({ where: { id: accountId, userId } });
  if (!account) throw new Error("Account not found");
  return account;
}

function revalidateTransactionViews(...accountIds) {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  for (const id of new Set(accountIds)) revalidatePath(`/account/${id}`);
}

// A user rule re-sorts a transaction left as "Other" (rules never override a chosen category).
async function applyUserRules(userId, input) {
  if (input.category !== "other-expense" && input.category !== "other-income") return input;
  const rules = await db.rule.findMany({ where: { userId } });
  const hit = categorize(input.description, rules);
  if (hit?.source === "rule" && isIncomeCategory(hit.category) === (input.type === "INCOME")) {
    return { ...input, category: hit.category };
  }
  return input;
}

export async function createTransaction(data) {
  const user = await requireUser();
  await enforceRateLimit(user.clerkUserId);
  const input = await applyUserRules(user.id, parseInput(data));

  const transaction = await db.$transaction(async (tx) => {
    await assertAccountOwned(tx, input.accountId, user.id);

    const created = await tx.transaction.create({
      data: { ...input, userId: user.id },
    });

    // Atomic increment avoids lost updates when two writes race.
    await tx.account.update({
      where: { id: input.accountId },
      data: { balance: { increment: signed(input.type, input.amount) } },
    });

    return created;
  });

  revalidateTransactionViews(transaction.accountId);
  return { success: true, data: serialize(transaction) };
}

// "coffee 4.50 yesterday" -> a saved transaction in the user's main account.
export async function quickAddTransaction(text, accountId) {
  try {
    const user = await requireUser();
    const rules = await db.rule.findMany({ where: { userId: user.id } });
    const parsed = parseQuickAdd(String(text || "").slice(0, 200), { rules });
    if (!parsed.valid) throw new Error("Include what it was and an amount, e.g. \"coffee 4.50\"");

    const account =
      (accountId && (await db.account.findUnique({ where: { id: accountId, userId: user.id } }))) ||
      (await db.account.findFirst({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }));
    if (!account) throw new Error("Add an account first");

    return await createTransaction({
      type: parsed.type,
      amount: parsed.amount,
      description: parsed.description,
      date: parsed.date,
      accountId: account.id,
      category: parsed.category,
      isRecurring: Boolean(parsed.recurringInterval),
      recurringInterval: parsed.recurringInterval,
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getTransaction(id) {
  const user = await requireUser();

  const transaction = await db.transaction.findUnique({
    where: { id, userId: user.id },
  });
  if (!transaction) throw new Error("Transaction not found");

  return serialize(transaction);
}

export async function updateTransaction(id, data) {
  const user = await requireUser();
  const input = parseInput(data);

  const original = await db.transaction.findUnique({
    where: { id, userId: user.id },
  });
  if (!original) throw new Error("Transaction not found");

  const transaction = await db.$transaction(async (tx) => {
    await assertAccountOwned(tx, input.accountId, user.id);

    // Undo the original effect on its account, then apply the new one.
    // This stays correct even when the transaction moves between accounts.
    await tx.account.update({
      where: { id: original.accountId },
      data: {
        balance: { increment: -signed(original.type, original.amount.toNumber()) },
      },
    });
    await tx.account.update({
      where: { id: input.accountId },
      data: { balance: { increment: signed(input.type, input.amount) } },
    });

    return tx.transaction.update({
      where: { id, userId: user.id },
      data: input,
    });
  });

  revalidateTransactionViews(original.accountId, input.accountId);
  return { success: true, data: serialize(transaction) };
}

// Only whitelisted filters — callers can never widen the query past their own data.
export async function getUserTransactions({ accountId, type, from, to } = {}) {
  const user = await requireUser();

  const where = { userId: user.id };
  if (accountId) where.accountId = String(accountId);
  if (type === "INCOME" || type === "EXPENSE") where.type = type;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lt = new Date(to);
  }

  const transactions = await db.transaction.findMany({
    where,
    include: { account: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });

  return serializeMany(transactions);
}

const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const EXPENSE_CATEGORY_IDS = defaultCategories
  .filter((c) => c.type === "EXPENSE")
  .map((c) => c.id);

export async function scanReceipt(file) {
  const user = await requireUser();
  await enforceRateLimit(user.clerkUserId);

  if (!file || typeof file.arrayBuffer !== "function") throw new Error("No file uploaded");
  if (!RECEIPT_TYPES.includes(file.type)) throw new Error("Please upload a JPG, PNG or WEBP image");
  if (file.size > MAX_RECEIPT_BYTES) throw new Error("Image must be smaller than 5MB");
  if (!process.env.GEMINI_API_KEY) throw new Error("Receipt scanning is not configured");

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    const prompt = `
      Analyze this receipt image and return JSON with exactly these keys:
      {
        "amount": number (the total paid),
        "date": "ISO 8601 date",
        "description": "short summary of items",
        "merchantName": "string",
        "category": one of: ${EXPENSE_CATEGORY_IDS.join(", ")}
      }
      If the image is not a receipt, return {}.
    `;

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType: file.type } },
      prompt,
    ]);

    const text = result.response.text().replace(/```(?:json)?\n?/g, "").trim();
    const data = JSON.parse(text);

    const amount = Number.parseFloat(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Couldn't find a total on this receipt");
    }
    const date = new Date(data.date);

    return {
      amount: Math.round(amount * 100) / 100,
      date: Number.isNaN(date.getTime()) ? new Date() : date,
      description: data.description || data.merchantName || "",
      category: EXPENSE_CATEGORY_IDS.includes(data.category) ? data.category : "other-expense",
      merchantName: data.merchantName || "",
    };
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error(
      error.message?.startsWith("Couldn't") ? error.message : "Failed to scan receipt"
    );
  }
}
