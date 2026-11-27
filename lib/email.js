import "server-only";
import { Resend } from "resend";

// Not a server action: keeping this out of a "use server" file means the
// browser can't call it directly to send arbitrary email.
export async function sendEmail({ to, subject, react }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email:", subject);
    return { success: false, error: "Email not configured" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Welth <onboarding@resend.dev>",
      to,
      subject,
      react,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message };
  }
}
