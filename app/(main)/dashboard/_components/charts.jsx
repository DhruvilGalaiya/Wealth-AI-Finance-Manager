"use client";

import { format } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMoney } from "@/components/providers/currency-provider";

const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
};

function ChartTooltip({ active, payload, label, money, labelFormat }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">{labelFormat ? labelFormat(label) : label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.stroke }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-medium tabular text-foreground">{money(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function BalanceChart({ data }) {
  const money = useMoney();
  return (
    <div className="h-48 w-full" role="img" aria-label="Total balance over the last 90 days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            {...axisProps}
            tickFormatter={(d) => format(new Date(d), "MMM d")}
            minTickGap={48}
          />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip
            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
            content={<ChartTooltip money={money} labelFormat={(d) => format(new Date(d), "PP")} />}
          />
          <Area
            type="monotone"
            dataKey="balance"
            name="Balance"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#balanceFill)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CashFlowChart({ data }) {
  const money = useMoney();
  return (
    <div className="h-56 w-full" role="img" aria-label="Income and spending by month">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barGap={2} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="0" />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis
            {...axisProps}
            width={56}
            tickFormatter={(v) => money(v, { compact: true })}
          />
          <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.6 }} content={<ChartTooltip money={money} />} />
          <Bar dataKey="income" name="Income" fill="hsl(var(--chart-income))" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expenses" name="Spending" fill="hsl(var(--chart-expense))" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
