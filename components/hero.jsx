import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// A static, illustrative preview of the dashboard (example numbers).
function ProductPreview() {
  const bars = [62, 48, 71, 55, 80, 66];
  const spend = [
    ["Housing", 46],
    ["Groceries", 22],
    ["Dining", 14],
    ["Transport", 9],
  ];
  return (
    <div className="relative mx-auto mt-14 max-w-5xl" aria-hidden>
      <div className="absolute -inset-x-8 -top-8 bottom-0 -z-10 rounded-[2rem] bg-gradient-to-b from-primary/10 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/5">
        <div className="flex items-center gap-1.5 border-b px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />
        </div>
        <div className="grid gap-4 bg-background p-4 text-left sm:p-6 md:grid-cols-3">
          <div className="rounded-xl border bg-card p-5 md:col-span-2">
            <p className="text-xs text-muted-foreground">Total balance</p>
            <p className="mt-1 text-2xl font-semibold tabular">$24,816.40</p>
            <p className="text-xs text-positive">+ $1,204.10 last 30 days</p>
            <svg viewBox="0 0 300 80" className="mt-4 h-24 w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="heroFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,60 C30,58 50,50 80,52 S130,40 160,38 S210,30 240,24 S280,16 300,12 L300,80 L0,80 Z" fill="url(#heroFill)" />
              <path d="M0,60 C30,58 50,50 80,52 S130,40 160,38 S210,30 240,24 S280,16 300,12" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
            </svg>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Monthly budget</p>
              <span className="rounded-full bg-positive/10 px-2 py-0.5 text-[10px] font-medium text-positive">On track</span>
            </div>
            <p className="mt-1 text-2xl font-semibold tabular">$1,920</p>
            <p className="text-xs text-muted-foreground">of $3,000 spent</p>
            <div className="mt-4 h-2 rounded-full bg-muted">
              <div className="h-2 w-[64%] rounded-full bg-positive" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
              <div><p className="text-muted-foreground">Left</p><p className="font-medium tabular">$1,080</p></div>
              <div><p className="text-muted-foreground">Per day</p><p className="font-medium tabular">$98.18</p></div>
            </div>
          </div>
          <div className="hidden rounded-xl border bg-card p-5 sm:block md:col-span-2">
            <p className="text-xs text-muted-foreground">Cash flow</p>
            <div className="mt-4 flex h-24 items-end gap-3">
              {bars.map((h, i) => (
                <div key={i} className="flex flex-1 items-end gap-1">
                  <div className="flex-1 rounded-t bg-chart-income" style={{ height: `${h}%` }} />
                  <div className="flex-1 rounded-t bg-chart-expense" style={{ height: `${h * 0.72}%` }} />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden rounded-xl border bg-card p-5 sm:block">
            <p className="text-xs text-muted-foreground">Spending</p>
            <ul className="mt-3 space-y-2.5">
              {spend.map(([name, pct]) => (
                <li key={name} className="text-xs">
                  <div className="flex justify-between"><span>{name}</span><span className="text-muted-foreground">{pct}%</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary/70" style={{ width: `${pct * 2}%` }} /></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="container pb-20 pt-16 text-center sm:pt-24">
      <p className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Personal finance, with AI that explains
      </p>
      <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
        Know where your money goes — and where it&apos;s heading.
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
        Welth brings your accounts, spending and budget together, then tells you in plain language what it all means.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/dashboard">Get started free <ArrowRight /></Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href="#features">See features</a>
        </Button>
      </div>
      <ProductPreview />
    </section>
  );
}
