import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import { CalendarClock, Repeat } from "lucide-react";
import { getUserAccounts } from "@/actions/dashboard";
import { getGoals, getRecurringTemplates } from "@/actions/goals";
import { projectBalance, upcomingOccurrences } from "@/lib/forecast";
import { PageHeader } from "@/components/app/page-header";
import { SectionCard, EmptyState, Pill } from "@/components/app/section-card";
import { Money } from "@/components/app/money";
import { CategoryIcon, getCategory } from "@/components/app/category-icon";
import { Button } from "@/components/ui/button";
import { ForecastChart } from "./_components/forecast-chart";
import { Goals } from "./_components/goals";

export const metadata = { title: "Plan" };

const INTERVAL = { DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly", YEARLY: "Yearly" };

function dayLabel(d) {
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE, MMM d");
}

export default async function PlanPage() {
  const [accounts, templates, goals] = await Promise.all([getUserAccounts(), getRecurringTemplates(), getGoals()]);
  const totalCash = accounts.reduce((s, a) => s + a.balance, 0);
  const upcoming = upcomingOccurrences(templates, 30);
  const projection = projectBalance(totalCash, upcoming, 30);
  const bills = upcoming.filter((o) => o.type === "EXPENSE").reduce((s, o) => s + o.amount, 0);
  const income = upcoming.filter((o) => o.type === "INCOME").reduce((s, o) => s + o.amount, 0);

  // Group by day for the list
  const groups = [];
  for (const o of upcoming) {
    const key = format(new Date(o.date), "yyyy-MM-dd");
    if (groups.at(-1)?.key !== key) groups.push({ key, date: new Date(o.date), items: [] });
    groups.at(-1).items.push(o);
  }

  return (
    <>
      <PageHeader title="Plan" description="What's scheduled for the next 30 days, and what you're saving for." />

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Next 30 days</h2>
      {upcoming.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={CalendarClock}
            title="Nothing scheduled yet"
            description="Mark rent, salary or subscriptions as repeating and they'll show up here with a balance forecast."
            action={<Button asChild size="sm"><Link href="/transaction/create">Add a repeating transaction</Link></Button>}
            className="py-10"
          />
        </SectionCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <SectionCard className="lg:col-span-3" bodyClassName="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Projected in 30 days</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight"><Money amount={projection.end} /></p>
              </div>
              <dl className="flex gap-6 text-sm">
                <div><dt className="text-muted-foreground">Coming in</dt><dd className="font-medium text-positive"><Money amount={income} /></dd></div>
                <div><dt className="text-muted-foreground">Going out</dt><dd className="font-medium"><Money amount={bills} /></dd></div>
                <div>
                  <dt className="text-muted-foreground">Lowest</dt>
                  <dd className={projection.low.balance < 0 ? "font-medium text-negative" : "font-medium"}><Money amount={projection.low.balance} /></dd>
                </div>
              </dl>
            </div>
            {projection.low.balance < 0 && (
              <p className="mt-3"><Pill tone="negative">Dips below zero on {format(new Date(projection.low.date), "MMM d")}</Pill></p>
            )}
            <div className="-mx-1 mt-4"><ForecastChart points={projection.points} /></div>
            <p className="mt-1 text-xs text-muted-foreground">Based on repeating transactions only; day-to-day spending isn&apos;t included.</p>
          </SectionCard>

          <SectionCard title="Upcoming" className="lg:col-span-2" bodyClassName="max-h-[380px] overflow-y-auto py-2">
            <ol>
              {groups.map((g) => (
                <li key={g.key} className="py-2">
                  <p className="pb-1 text-xs font-medium text-muted-foreground">{dayLabel(g.date)}</p>
                  <ul>
                    {g.items.map((o) => (
                      <li key={o.id} className="flex items-center gap-3 py-1.5">
                        <CategoryIcon category={o.category} className="h-8 w-8" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{o.description || getCategory(o.category).name}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground"><Repeat className="h-3 w-3" /> {INTERVAL[o.interval]}</p>
                        </div>
                        <Money amount={o.amount} type={o.type} signed className="text-sm font-medium" />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>
      )}

      <div className="mt-10">
        <Goals goals={goals} />
      </div>
    </>
  );
}
