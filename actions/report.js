"use server";

import { inngest } from "@/lib/inngest/client";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";

// Emails a report for the signed-in user only.
export async function triggerManualReport() {
  try {
    const user = await requireUser();
    await enforceRateLimit(user.clerkUserId);

    await inngest.send({ name: "report.generate", data: { userId: user.id } });
    return { success: true };
  } catch (error) {
    console.error("Failed to trigger report:", error);
    return { success: false, error: error.message || "Failed to trigger report" };
  }
}
