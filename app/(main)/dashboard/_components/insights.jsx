import { format } from "date-fns";
import { LifeBuoy, AlertTriangle, CalendarClock, UserRound, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SectionCard, EmptyState, Pill, Skeleton } from "@/components/app/section-card";
import { Money } from "@/components/app/money";
import { getCategory } from "@/components/app/category-icon";
import { getRecurringForecast, getSpendingPersona } from "@/actions/insights";

function InsightTitle({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" /> {children}
    </span>
  );
}

export function SafetyNetCard({ runwayDays, averageMonthly }) {
  let tone = "neutral";
  let label = "Not enough data";
  if (runwayDays != null) {
    if (runwayDays >= 180) [tone, label] = ["positive", "Strong"];
    else if (runwayDays >= 90) [tone, label] = ["primary", "Healthy"];
    else if (runwayDays >= 30) [tone, label] = ["warning", "Thin"];
    else [tone, label] = ["negative", "Very thin"];
  }

  return (
    <SectionCard title={<InsightTitle icon={LifeBuoy}>Safety net</InsightTitle>} className="h-full">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular">{runwayDays ?? "—"}</span>
        <span className="text-sm text-muted-foreground">days</span>
        <Pill tone={tone} className="ml-auto">{label}</Pill>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {runwayDays != null ? (
          <>How long your cash would last with no income, at your typical spend of{" "}
            <Money amount={averageMonthly} className="font-medium text-foreground" />/month.</>
        ) : (
          "Add a few weeks of spending and we'll estimate how long your cash would last."
        )}
      </p>
    </SectionCard>
  );
}

export function AnomaliesCard({ anomalies }) {
  return (
    <SectionCard
      title={<InsightTitle icon={AlertTriangle}>Unusual spending</InsightTitle>}
      description="Last 90 days, compared with your normal purchases."
      className="h-full"
    >
      {anomalies.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing out of the ordinary. Nice.</p>
      ) : (
        <ul className="divide-y">
          {anomalies.slice(0, 4).map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate font-medium">{t.description || getCategory(t.category).name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(t.date), "MMM d")} · {getCategory(t.category).name}
                </p>
              </div>
              <Money amount={t.amount} className="shrink-0 font-medium" />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export async function PersonaCard() {
  const persona = await getSpendingPersona();

  return (
    <SectionCard
      title={<InsightTitle icon={UserRound}>Spending style</InsightTitle>}
      description="Based on the last 3 months, as a share of income."
      className="h-full"
    >
      {persona.status === "insufficient-data" && (
        <p className="text-sm text-muted-foreground">
          We need a bit more history (income and a few expenses) to read your spending style.
        </p>
      )}
      {persona.status !== "insufficient-data" && (
        <>
          {persona.status === "ok" ? (
            <>
              <Pill tone={persona.tone} className="mb-2">{persona.name}</Pill>
              <p className="text-sm text-muted-foreground">{persona.trait}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">The AI model is offline — here&apos;s your raw split:</p>
          )}
          <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
            {[
              ["Home", persona.features.housing_pct],
              ["Food", persona.features.food_pct],
              ["Fun", persona.features.entertainment_pct],
              ["Saved", persona.features.savings_pct],
            ].map(([label, v]) => (
              <div key={label} className="rounded-lg bg-muted/60 px-1 py-2">
                <dd className="text-sm font-semibold tabular">{v.toFixed(0)}%</dd>
                <dt className="text-[11px] text-muted-foreground">{label}</dt>
              </div>
            ))}
          </dl>
        </>
      )}
    </SectionCard>
  );
}

const TREND = {
  Stable: { tone: "neutral", icon: Minus, label: "Stable" },
  "Creeping Cost": { tone: "warning", icon: TrendingUp, label: "Creeping up" },
  "Anomalous Spike": { tone: "negative", icon: TrendingUp, label: "Spike likely" },
};

export async function RecurringCard() {
  const forecast = await getRecurringForecast();

  return (
    <SectionCard
      title={<InsightTitle icon={CalendarClock}>Bills forecast</InsightTitle>}
      description="Your regular costs and where they're heading next month."
      className="h-full"
    >
      {forecast.items.length === 0 ? (
        <EmptyState
          title="No regular bills found yet"
          description="Mark rent, utilities or subscriptions as recurring and we'll watch their prices."
          className="py-4"
        />
      ) : (
        <ul className="divide-y">
          {forecast.items.map((item) => {
            const trend = TREND[item.status];
            const down = item.predicted != null && item.predicted < item.current - 1;
            return (
              <li key={item.category} className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Last month <Money amount={item.current} />
                    {item.predicted != null && (
                      <> · Next ~<Money amount={item.predicted} /></>
                    )}
                  </p>
                </div>
                {trend ? (
                  <Pill tone={down ? "positive" : trend.tone} icon={down ? TrendingDown : trend.icon}>
                    {down ? "Trending down" : trend.label}
                  </Pill>
                ) : (
                  <Pill>Model offline</Pill>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

export function InsightSkeleton() {
  return (
    <div className="h-full rounded-xl border bg-card p-5">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-3 w-48" />
      <Skeleton className="mt-6 h-8 w-full" />
      <Skeleton className="mt-2 h-8 w-full" />
    </div>
  );
}
