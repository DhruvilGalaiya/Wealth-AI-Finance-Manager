"use client";

import { format } from "date-fns";
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMoney } from "@/components/providers/currency-provider";

export function ForecastChart({ points }) {
  const money = useMoney();
  const min = Math.min(...points.map((p) => p.balance));
  const dips = min < 0;

  return (
    <div className="h-44 w-full" role="img" aria-label="Projected balance over the next 30 days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.16} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={48}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={(d) => format(new Date(d), "MMM d")} />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          {dips && <ReferenceLine y={0} stroke="hsl(var(--negative))" strokeDasharray="4 4" />}
          <Tooltip
            cursor={{ stroke: "hsl(var(--border))" }}
            formatter={(v) => [money(v), "Projected"]}
            labelFormatter={(d) => format(new Date(d), "EEE, MMM d")}
            contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          />
          <Area type="stepAfter" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#forecastFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
