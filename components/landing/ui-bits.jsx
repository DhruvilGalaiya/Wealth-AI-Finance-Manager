// Small, static pieces of Welth's real UI, used as pictures on the landing page.
import { ArrowUpRight, Home, ShoppingCart, UtensilsCrossed, Car, Repeat, Sparkles, LifeBuoy, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

export function Piece({ className, children, style }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-4 text-left shadow-[0_1px_2px_hsl(var(--foreground)/.04),0_8px_24px_-12px_hsl(var(--foreground)/.12)]", className)} style={style}>
      {children}
    </div>
  );
}

export function BalancePiece() {
  return (
    <>
      <p className="text-[11px] text-muted-foreground">Total balance</p>
      <p className="mt-0.5 text-xl font-semibold tabular">$18,240.55</p>
      <p className="flex items-center gap-1 text-[11px] text-positive"><ArrowUpRight className="h-3 w-3" /> $1,204.10 last 30 days</p>
      <svg viewBox="0 0 200 56" className="mt-3 h-14 w-full" preserveAspectRatio="none" aria-hidden>
        <path d="M0,46 C20,44 34,40 52,41 S86,30 104,31 S140,22 158,18 S186,10 200,8 L200,56 L0,56Z" fill="hsl(var(--primary)/.12)" />
        <path d="M0,46 C20,44 34,40 52,41 S86,30 104,31 S140,22 158,18 S186,10 200,8" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
      </svg>
    </>
  );
}

export function BudgetPiece({ used = 61, expected = 55, loop = false }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">Monthly budget</p>
        <span className="rounded-full bg-positive/10 px-2 py-0.5 text-[10px] font-medium text-positive">On track</span>
      </div>
      <p className="mt-0.5 text-xl font-semibold tabular">$1,830 <span className="text-xs font-normal text-muted-foreground">of $3,000</span></p>
      <div className="relative mt-3">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full bg-positive", loop && "loop-fill")} style={{ width: `${used}%` }} />
        </div>
        <div className="absolute -top-1 h-4 w-0.5 rounded bg-foreground/60" style={{ left: `${expected}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>{used}% used</span><span>Day 17 of 30</span></div>
    </>
  );
}

const CATS = [
  { name: "Housing", pct: 44, icon: Home, color: "#ef4444" },
  { name: "Groceries", pct: 18, icon: ShoppingCart, color: "#14b8a6" },
  { name: "Dining", pct: 12, icon: UtensilsCrossed, color: "#f97316" },
  { name: "Transport", pct: 9, icon: Car, color: "#3b82f6" },
];

export function CategoryIconBubble({ icon: Icon, color, size = "h-7 w-7" }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full", size)} style={{ background: `${color}1f`, color }}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

export function SpendingPiece() {
  return (
    <>
      <p className="text-[11px] text-muted-foreground">Spending by category</p>
      <ul className="mt-2.5 space-y-2.5">
        {CATS.map((c) => (
          <li key={c.name} className="flex items-center gap-2.5">
            <CategoryIconBubble icon={c.icon} color={c.color} />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between text-[11px]"><span className="font-medium">{c.name}</span><span className="text-muted-foreground">{c.pct}%</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary/70" style={{ width: `${c.pct * 2}%` }} /></div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export function ReceiptPiece({ loop = false }) {
  return (
    <>
      <div className="flex items-center gap-2 text-[11px] font-medium"><ScanLine className="h-3.5 w-3.5 text-primary" /> Receipt scanned</div>
      <div className="relative mt-3 overflow-hidden rounded-lg border bg-background p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
        <p className="text-foreground">FRESH MARKET</p>
        <p>Oat milk ........ 3.20</p>
        <p>Spinach ......... 2.80</p>
        <p>Chicken ........ 11.90</p>
        <p className="text-foreground">TOTAL ......... 46.20</p>
        {loop && <div className="loop-scan absolute inset-x-0 top-0 h-0.5 bg-primary shadow-[0_0_12px_hsl(var(--primary))]" style={{ "--scan-h": "96px" }} />}
      </div>
      <dl className={cn("mt-3 grid grid-cols-3 gap-2 text-[10px]", loop && "loop-appear")}>
        <div><dt className="text-muted-foreground">Amount</dt><dd className="font-medium tabular">$46.20</dd></div>
        <div><dt className="text-muted-foreground">Category</dt><dd className="font-medium">Groceries</dd></div>
        <div><dt className="text-muted-foreground">Date</dt><dd className="font-medium">Nov 17</dd></div>
      </dl>
    </>
  );
}

export const SAMPLE_TX = [
  { id: 1, name: "Fresh Market", cat: "Groceries", icon: ShoppingCart, color: "#14b8a6", date: "Nov 17", amount: -46.2, account: "Everyday checking" },
  { id: 2, name: "Salary", cat: "Salary", icon: ArrowUpRight, color: "#22c55e", date: "Nov 15", amount: 4950, account: "Everyday checking", repeats: "Monthly" },
  { id: 3, name: "Rent", cat: "Housing", icon: Home, color: "#ef4444", date: "Nov 3", amount: -1450, account: "Everyday checking", repeats: "Monthly" },
  { id: 4, name: "Lunch with Maya", cat: "Dining", icon: UtensilsCrossed, color: "#f97316", date: "Nov 2", amount: -18.5, account: "Everyday checking" },
  { id: 5, name: "Metro card", cat: "Transport", icon: Car, color: "#3b82f6", date: "Nov 1", amount: -32, account: "Everyday checking" },
];

export const usd = (n) =>
  `${n < 0 ? "−" : "+"}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function TxRows({ rows = SAMPLE_TX.slice(0, 3) }) {
  return (
    <ul className="divide-y">
      {rows.map((t) => (
        <li key={t.id} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
          <CategoryIconBubble icon={t.icon} color={t.color} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium">{t.name}</p>
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">{t.cat} · {t.date}{t.repeats && <Repeat className="h-2.5 w-2.5" />}</p>
          </div>
          <span className={cn("text-[11px] font-medium tabular", t.amount > 0 && "text-positive")}>{usd(t.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

export function ChatPiece() {
  return (
    <>
      <div className="flex items-center gap-1.5 text-[11px] font-medium"><Sparkles className="h-3.5 w-3.5 text-primary" /> Ask Welth</div>
      <div className="mt-3 space-y-2 text-[11px] leading-snug">
        <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-1.5 text-primary-foreground">Can I afford a $600 flight in December?</p>
        <p className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-muted px-3 py-1.5">Yes. You&apos;d still finish the month $340 under budget, and your cash would cover about 131 days of spending.</p>
      </div>
    </>
  );
}

export function SafetyPiece() {
  return (
    <>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><LifeBuoy className="h-3.5 w-3.5" /> Safety net</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tabular">142</span><span className="text-[11px] text-muted-foreground">days</span>
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Healthy</span>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">at your typical $3,850 a month</p>
    </>
  );
}

export function VerdictPiece() {
  return (
    <>
      <p className="text-[11px] text-muted-foreground">Can I afford it?</p>
      <p className="mt-1 text-lg font-semibold tabular">$600</p>
      <span className="mt-1 inline-flex rounded-full bg-positive/10 px-2 py-0.5 text-[10px] font-medium text-positive">Looks fine</span>
      <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2 text-[10px]">
        <div><p className="text-muted-foreground">Budget used</p><p className="font-medium tabular">61% → 81%</p></div>
        <div><p className="text-muted-foreground">Safety net</p><p className="font-medium tabular">142 → 131d</p></div>
      </div>
    </>
  );
}

export function RecurringPiece() {
  return (
    <>
      <div className="flex items-center gap-1.5 text-[11px] font-medium"><Repeat className="h-3.5 w-3.5 text-primary" /> Repeats monthly</div>
      <div className="mt-2 flex items-center justify-between text-[11px]"><span>Rent</span><span className="tabular">−$1,450.00</span></div>
      <p className="text-[10px] text-muted-foreground">Next on Dec 3</p>
    </>
  );
}
