"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isSupportedCurrency } from "@/lib/currency";

export async function updateCurrency(code) {
  try {
    const user = await requireUser();
    if (!isSupportedCurrency(code)) throw new Error("Unsupported currency");

    await db.user.update({ where: { id: user.id }, data: { currency: code } });

    revalidatePath("/", "layout");
    return { success: true, currency: code };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
