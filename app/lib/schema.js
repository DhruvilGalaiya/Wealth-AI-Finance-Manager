import { z } from "zod";

const MAX_AMOUNT = 1_000_000_000;

// Accepts "12", "12.5", "12.50" — at most two decimals.
const moneyString = (label, { allowZero = false, allowNegative = false } = {}) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => /^-?\d+(\.\d{1,2})?$/.test(v), `${label} must be a number with up to 2 decimals`)
    .refine((v) => allowNegative || Number(v) >= 0, `${label} cannot be negative`)
    .refine((v) => allowZero || Number(v) !== 0, `${label} must be greater than 0`)
    .refine((v) => Math.abs(Number(v)) <= MAX_AMOUNT, `${label} is too large`);

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
  type: z.enum(["CURRENT", "SAVINGS"]),
  balance: moneyString("Initial balance", { allowZero: true, allowNegative: true }),
  isDefault: z.boolean().default(false),
});

export const RECURRING_INTERVALS = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

export const transactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: moneyString("Amount"),
    description: z.string().max(200, "Description is too long").optional(),
    date: z.date({ required_error: "Date is required" }),
    accountId: z.string().min(1, "Account is required"),
    category: z.string().min(1, "Category is required"),
    isRecurring: z.boolean().default(false),
    recurringInterval: z.enum(RECURRING_INTERVALS).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring interval is required for recurring transactions",
        path: ["recurringInterval"],
      });
    }
  });

// What the server actually accepts from the client (amount already a number).
export const transactionInputSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive("Amount must be greater than 0").max(MAX_AMOUNT),
  description: z.string().max(200).optional().nullable(),
  date: z.coerce.date(),
  accountId: z.string().min(1),
  category: z.string().min(1).max(50),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(RECURRING_INTERVALS).optional().nullable(),
});
