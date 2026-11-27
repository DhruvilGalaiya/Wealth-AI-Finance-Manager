import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Plus, Receipt, Wallet, CalendarClock } from "lucide-react";
import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { getGoals, getRecurringTemplates } from "@/actions/goals";
import { checkUser } from "@/lib/checkUser";
import { formatMoney } from "@/lib/currency";
import { balanceHistory, budgetPacing, categoryBreakdown, detectAnomalies, monthTotals } from "@/lib/finance";
import { projectBalance, upcomingOccurrences } from "@/lib/forecast";
import { buildAttention } from "@/lib/attention";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard, EmptyState } from "@/components/app/section-card";
import { Money } from "@/components/app/money";
import { TransactionRow } from "@/components/app/transaction-row";
import { CategoryIcon, getCategory } from "@/components/app/category-icon";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { Button } from "@/components/ui/button";
import { BalanceChart } from "./_components/charts";
import { BudgetCard } from "./_components/budget-card";
import { SpendingCard } from "./_components/spending-card";
import { GenerateReportButton } from "./_components/generate-report-button";
import { AttentionFeed } from "./_components/attention";

export const metadata = { title: "Dashboard" };

function greeting(name) {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const first = name?.split(" ")[0];
  return first ? `${part}, ${first}` : part;
}

const when = (d) => (isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : format(d, "EEE, MMM d"));

export default async function DashboardPage() {
  const [user, accounts, transactions, templates, goals] = await Promise.all([
    checkUser(),
    getUserAccounts(),
    getDashboardData(),
    getRecurringTemplates(),
    getGoals(),
  ]);

  const header = (
    <PageHeader
      title={greeting(user?.name)}
      description={format(new Date(), "EEEE, MMMM d")}
      actions={accounts.length > 0 && <GenerateReportButton />}
    />
  );

  if (accounts.length === 0) {
    return (
      <>
        {header}
        <SectionCard>
          <EmptyState
            icon={Wallet}
            title="Add your first account to get started"
            description="Enter the balance of a checking or savings account. Then add transactions, set a budget and get insights."
            action={<CreateAccountDrawer><Button><Plus /> Add account</Button></CreateAccountDrawer>}
            className="py-14"
          />
        </SectionCard>
      </>
    );
  }

  const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];
  const budgetData = await getCurrentBudget(defaultAccount.id);
  const currency = user?.currency || "USD";
  const money = (n) => formatMoney(n, currency);

  const totalCash = accounts.reduce((s, a) => s + a.balance, 0);
  const month = monthTotals(transactions);
  const history = balanceHistory(transactions, totalCash, 90);
  const change30 = totalCash - (history[history.length - 31]?.balance ?? totalCash);
  const budget = budgetData?.budget?.amount || 0;
  const pacing = budget > 0 ? budgetPacing(budgetData.currentExpenses, budget) : null;
  const upcoming = upcomingOccurrences(templates, 30);
  const projection = projectBalance(totalCash, upcoming, 30);
  const attention = buildAttention({
    pacing,
    budget,
    upcoming,
    projection,
    anomalies: detectAnomalies(transactions),
    uncategorized: transactions.filter((t) => t.category === "other-expense" || t.category === "other-income").length,
    goals,
    money,
  });
  const accountNames = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  const nextBills = upcoming.filter((o) => o.type === "EXPENSE").slice(0, 4);

  return (
    <>
      {header}
      <AttentionFeed items={attention} />

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" bodyClassName="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total balance</p>
              <p className="mt-1 text-4xl font-semibold tracking-[-0.02em]"><Money amount={totalCash} /></p>
              <p className="mt-1.5 flex items-center gap-1 text-sm">
                {change30 >= 0 ? <ArrowUpRight className="h-4 w-4 text-positive" /> : <ArrowDownRight className="h-4 w-4 text-negative" />}
                <Money amount={Math.abs(change30)} className={change30 >= 0 ? "text-positive" : "text-negative"} />
                <span className="text-muted-foreground">in 30 days</span>
              </p>
            </div>
            <Link href="/accounts" className="text-sm text-muted-foreground hover:text-foreground">
              {accounts.length} account{accounts.length > 1 ? "s" : ""}
            </Link>
          </div>
          <div className="-mx-1 mt-4"><BalanceChart data={history} /></div>
        </SectionCard>

        <BudgetCard budget={budget} spent={budgetData?.currentExpenses || 0} pacing={pacing} accountName={accounts.length > 1 ? defaultAccount.name : null} />

        <SectionCard
          title="Recent transactions"
          action={<Link href="/transactions" className="text-sm font-medium text-primary hover:underline">See all</Link>}
          className="lg:col-span-2"
          bodyClassName="py-1"
        >
          {transactions.length === 0 ? (
            <EmptyState icon={Receipt} title="No transactions yet" description="Press ⌘K and type something like “coffee 4.50”." />
          ) : (
            <ul className="divide-y">
              {transactions.slice(0, 6).map((t) => (
                <TransactionRow key={t.id} transaction={t} accountName={accounts.length > 1 ? accountNames[t.accountId] : null} />
              ))}
            </ul>
          )}
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SpendingCard categories={categoryBreakdown(transactions).slice(0, 5)} total={month.expenses} compact />

          <SectionCard
            title="Coming up"
            action={<Link href="/plan" className="text-sm font-medium text-primary hover:underline">Plan</Link>}
            bodyClassName="py-2"
          >
            {nextBills.length === 0 ? (
              <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground"><CalendarClock className="h-4 w-4" /> No bills scheduled.</p>
            ) : (
              <ul>
                {nextBills.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 py-2">
                    <CategoryIcon category={o.category} className="h-8 w-8" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{o.description || getCategory(o.category).name}</p>
                      <p className="text-xs text-muted-foreground">{when(new Date(o.date))}</p>
                    </div>
                    <Money amount={o.amount} className="text-sm font-medium" />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
