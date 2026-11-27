import { Suspense } from "react";
import { addMonths, format, startOfMonth } from "date-fns";
import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import {
  averageMonthlyExpenses,
  detectAnomalies,
  monthTotals,
  runwayDays,
} from "@/lib/finance";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard } from "@/components/app/section-card";
import { Money } from "@/components/app/money";
import { CashFlowChart } from "../dashboard/_components/charts";
import { WhatIfAgent } from "../dashboard/_components/what-if-agent";
import { AiCopilot } from "../dashboard/_components/ai-copilot";
import {
  AnomaliesCard,
  InsightSkeleton,
  PersonaCard,
  RecurringCard,
  SafetyNetCard,
} from "../dashboard/_components/insights";

export const metadata = { title: "Insights" };

function cashFlowByMonth(transactions, months = 6) {
  const start = startOfMonth(new Date());
  return Array.from({ length: months }, (_, i) => {
    const m = addMonths(start, -(months - 1 - i));
    const t = monthTotals(transactions, m);
    return { month: format(m, "MMM"), income: t.income, expenses: t.expenses };
  });
}

function SectionTitle({ children }) {
  return <h2 className="mb-3 mt-10 text-sm font-medium text-muted-foreground first:mt-0">{children}</h2>;
}

export default async function InsightsPage() {
  const [accounts, transactions] = await Promise.all([getUserAccounts(), getDashboardData()]);
  const totalCash = accounts.reduce((s, a) => s + a.balance, 0);
  const avgMonthly = averageMonthlyExpenses(transactions);
  const month = monthTotals(transactions);

  return (
    <>
      <PageHeader title="Insights" description="What your last few months say about the next one." />

      <SectionTitle>Cash flow</SectionTitle>
      <SectionCard>
        <dl className="mb-5 grid grid-cols-3 gap-4">
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-chart-income" /> Income this month</dt>
            <dd className="mt-1 text-xl font-semibold tracking-tight"><Money amount={month.income} /></dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-chart-expense" /> Spending this month</dt>
            <dd className="mt-1 text-xl font-semibold tracking-tight"><Money amount={month.expenses} /></dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Saved</dt>
            <dd className="mt-1 text-xl font-semibold tracking-tight">
              <Money amount={month.net} className={month.net < 0 ? "text-negative" : ""} />
              {month.income > 0 && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{month.savingsRate.toFixed(0)}%</span>}
            </dd>
          </div>
        </dl>
        <CashFlowChart data={cashFlowByMonth(transactions)} />
      </SectionCard>

      <SectionTitle>Health</SectionTitle>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SafetyNetCard runwayDays={runwayDays(totalCash, avgMonthly)} averageMonthly={avgMonthly} />
        <AnomaliesCard anomalies={detectAnomalies(transactions)} />
        <Suspense fallback={<InsightSkeleton />}>
          <PersonaCard />
        </Suspense>
      </div>

      <SectionTitle>Ahead</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Suspense fallback={<InsightSkeleton />}>
            <RecurringCard />
          </Suspense>
        </div>
        <div className="lg:col-span-3">
          <WhatIfAgent />
        </div>
      </div>

      <SectionTitle>Ask</SectionTitle>
      <AiCopilot />
    </>
  );
}
