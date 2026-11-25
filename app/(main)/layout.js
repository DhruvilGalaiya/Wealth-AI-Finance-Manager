import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { checkUser } from "@/lib/checkUser";
import { AppShell } from "@/components/app/app-shell";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { db } from "@/lib/prisma";

export default async function MainLayout({ children }) {
  const user = await checkUser();
  if (!user) {
    const { userId } = await auth();
    // Signed in but no profile => the database is unreachable; don't loop on sign-in.
    if (userId) throw new Error("We couldn't load your profile. Please try again shortly.");
    redirect("/sign-in");
  }

  // Rules power the quick-add preview; small list, fetched once per navigation.
  const rules = await db.rule.findMany({ where: { userId: user.id }, select: { match: true, category: true } });

  return (
    <CurrencyProvider currency={user.currency}>
      <AppShell user={{ name: user.name, email: user.email }} rules={rules}>{children}</AppShell>
    </CurrencyProvider>
  );
}
