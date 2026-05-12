"use server";

import { inngest } from "@/lib/inngest/client";

export async function triggerManualReport() {
  try {
    // This sends the exact signal your Inngest function is now waiting for
    await inngest.send({
      name: "report.generate",
      data: {}, 
    });
    
    return { success: true };
  } catch (error) {
    console.error("Failed to trigger report:", error);
    return { success: false, error: "Failed to trigger report" };
  }
}
