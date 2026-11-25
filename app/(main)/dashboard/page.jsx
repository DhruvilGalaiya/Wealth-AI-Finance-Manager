import { Suspense } from "react";
import Link from "next/link";
import { addMonths, format, startOfMonth } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Landmark, Plus, Receipt, Wallet } from "lucide-react";
import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { checkUser } from "@/lib/checkUser";
import {
  averageMonthlyExpenses,
  balanceHistory,
  budgetPacing,
  categoryBreakdown,
  detectAnomalies,
  monthTotals,
  runwayDays,
} from "@/lib/finance";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard, EmptyState } from "@/components/app/section-card";
import { Money } from "@/components/app/money";
import { TransactionRow } from "@/components/app/transaction-row";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { Button } from "@/components/ui/button";
import { AccountList } from "../accounts/_components/account-list";
import { BalanceChart, CashFlowChart } from "./_components/charts";
import { BudgetCard } from "./_components/budget-card";
import { SpendingCard } from "./_components/spending-card";
import { GenerateReportButton } from "./_components/generate-report-button";
import { WhatIfAgent } from "./_components/what-if-agent";
import { AiCopilot } from "./_components/ai-copilot";
import {
  AnomaliesCard,
  InsightSkeleton,
  PersonaCard,
  RecurringCard,
  SafetyNetCard,
} from "./_components/insights";

export const metadata = { title: "Dashboard" };

function greeting(name) {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const first = name?.split(" ")[0];
  return first ? `${part}, ${first}` : part;
}

function cashFlowByMonth(transactions, months = 6) {
  const start = startOfMonth(new Date());
  return Array.from({ length: months }, (_, i) => {
    const m = addMonths(start, -(months - 1 - i));
    const totals = monthTotals(transactions, m);
    return { month: format(m, "MMM"), income: totals.income, expenses: totals.expenses };
  });
}

export default async function DashboardPage() {
  const [user, accounts, transactions] = await Promise.all([
    checkUser(),
    getUserAccounts(),
    getDashboardData(),
  ]);

  const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];
  const budgetData = defaultAccount ? await getCurrentBudget(defaultAccount.id) : null;

  const totalCash = accounts.reduce((s, a) => s + a.balance, 0);
  const month = monthTotals(transactions);
  const categories = categoryBreakdown(transactions);
  const avgMonthly = averageMonthlyExpenses(transactions);
  const runway = runwayDays(totalCash, avgMonthly);
  const anomalies = detectAnomalies(transactions);
  const history = balanceHistory(transactions, totalCash, 90);
  const change30 = totalCash - (history[history.length - 31]?.balance ?? totalCash);
  const budget = budgetData?.budget?.amount || 0;
  const pacing = budget > 0 ? budgetPacing(budgetData.currentExpenses, budget) : null;
  const accountNames = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  const header = (
    <PageHeader
      title={greeting(user?.name)}
      description={`Here's where things stand for ${format(new Date(), "MMMM yyyy")}.`}
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
            description="Enter the balance of a checking or savings account. You can then add transactions, set a budget and get insights."
            action={
              <CreateAccountDrawer>
                <Button><Plus /> Add account</Button>
              </CreateAccountDrawer>
            }
            className="py-14"
          />
        </SectionCard>
      </>
    );
  }

  return (
    <>
      {header}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Net worth */}
        <SectionCard className="lg:col-span-2" bodyClassName="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total balance</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                <Money amount={totalCash} />
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm">
                {change30 >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-positive" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-negative" />
                )}
                <Money amount={Math.abs(change30)} className={change30 >= 0 ? "text-positive" : "text-negative"} />
                <span className="text-muted-foreground">last 30 days</span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {accounts.length} account{accounts.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="-mx-1 mt-4">
            <BalanceChart data={history} />
          </div>
        </SectionCard>

        <BudgetCard
          budget={budget}
          spent={budgetData?.currentExpenses || 0}
          pacing={pacing}
          accountName={defaultAccount?.name}
        />

        {/* Cash flow */}
        <SectionCard
          title="Cash flow"
          description="Income and spending over the last 6 months"
          className="lg:col-span-2"
        >
          <dl className="mb-4 grid grid-cols-3 gap-4">
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-chart-income" /> Income this month
              </dt>
              <dd className="mt-1 text-lg font-semibold"><Money amount={month.income} /></dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-chart-expense" /> Spending this month
              </dt>
              <dd className="mt-1 text-lg font-semibold"><Money amount={month.expenses} /></dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Saved</dt>
              <dd className="mt-1 text-lg font-semibold">
                <Money amount={month.net} className={month.net < 0 ? "text-negative" : ""} />
                {month.income > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    {month.savingsRate.toFixed(0)}%
                  </span>
                )}
              </dd>
            </div>
          </dl>
          <CashFlowChart data={cashFlowByMonth(transactions)} />
        </SectionCard>

        <SpendingCard categories={categories} total={month.expenses} />

        {/* Recent transactions */}
        <SectionCard
          title="Recent transactions"
          action={
            <Link href="/transactions" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          }
          className="lg:col-span-2"
          bodyClassName="py-2"
        >
          {transactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="Add income and expenses manually or scan a receipt."
              action={<Button asChild size="sm"><Link href="/transaction/create">Add transaction</Link></Button>}
            />
          ) : (
            <ul className="divide-y">
              {transactions.slice(0, 7).map((t) => (
                <TransactionRow key={t.id} transaction={t} accountName={accounts.length > 1 ? accountNames[t.accountId] : null} />
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Accounts */}
        <SectionCard
          title="Accounts"
          action={
            <CreateAccountDrawer>
              <Button variant="ghost" size="sm" className="-mr-2 h-8 text-primary">
                <Plus /> Add
              </Button>
            </CreateAccountDrawer>
          }
          bodyClassName="p-0 pt-3"
          className="overflow-hidden"
        >
          <AccountList accounts={accounts} showMakeDefault={false} grouped={false} />
          <Link
            href="/accounts"
            className="flex items-center justify-center gap-2 border-t px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Landmark className="h-4 w-4" /> Manage accounts
          </Link>
        </SectionCard>
      </div>

      {/* Insights */}
      <div className="mb-4 mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Insights</h2>
        <p className="text-sm text-muted-foreground">What your numbers are telling you.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SafetyNetCard runwayDays={runway} averageMonthly={avgMonthly} />
        <AnomaliesCard anomalies={anomalies} />
        <Suspense fallback={<InsightSkeleton />}>
          <PersonaCard />
        </Suspense>
        <Suspense fallback={<InsightSkeleton />}>
          <RecurringCard />
        </Suspense>
        <div className="md:col-span-2 lg:col-span-2">
          <WhatIfAgent />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <AiCopilot />
        </div>
      </div>
    </>
  );
}
