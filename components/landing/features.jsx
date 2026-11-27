import { Piece, BudgetPiece, ReceiptPiece } from "./ui-bits";

const DAYS = Array.from({ length: 30 }, (_, i) => i + 1);
const MARKED = { 1: "Salary", 3: "Rent", 12: "Internet", 20: "Streaming" };

function CurrencyLoop() {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {[["$1,234.50", "USD"], ["₹1,234.50", "INR"], ["1.234,50 €", "EUR"]].map(([v, c], i) => (
        <div key={c} className="loop-dot flex flex-col gap-1 rounded-xl border bg-background px-4 py-4" style={{ "--i": i }}>
          <span className="text-xs text-muted-foreground">{c}</span>
          <span className="text-xl font-semibold tabular">{v}</span>
        </div>
      ))}
    </div>
  );
}

function CalendarLoop() {
  return (
    <div className="grid grid-cols-10 gap-1 text-center text-[11px]">
      {DAYS.map((d) => {
        const mark = MARKED[d];
        return (
          <div key={d} className={mark ? "relative rounded-md bg-primary/10 py-1.5 font-medium text-primary" : "py-1.5 text-muted-foreground"}>
            {d}
            {mark && <span className="loop-dot absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" style={{ "--i": Object.keys(MARKED).indexOf(String(d)) }} />}
          </div>
        );
      })}
    </div>
  );
}

const CARDS = [
  { title: "Tracks your budget pace", body: "A marker shows where day 17 should be, so you see a fast month before it ends.", visual: <Piece className="p-5"><BudgetPiece loop /></Piece>, span: "md:col-span-8" },
  { title: "Reads a receipt photo", body: "Amount, date and category are filled in from the picture.", visual: <Piece className="p-5"><ReceiptPiece loop /></Piece>, span: "md:col-span-4" },
  { title: "Posts rent and salary on schedule", body: "Mark a transaction as monthly and it adds itself on the day.", visual: <Piece className="p-5"><CalendarLoop /></Piece>, span: "md:col-span-4" },
  { title: "Shows amounts in USD, INR or EUR", body: "Pick a currency once in Settings; every screen follows.", visual: <CurrencyLoop />, span: "md:col-span-8" },
];

export function Features() {
  return (
    <div className="grid gap-6 md:grid-cols-12">
      {CARDS.map((c) => (
        <article key={c.title} className={`card flex flex-col rounded-[1.25rem] border bg-card p-5 ${c.span || ""}`}>
          <div className="loop-group flex h-[200px] items-center overflow-hidden rounded-xl bg-muted/50 p-4">
            <div className="w-full">{c.visual}</div>
          </div>
          <h3 className="mt-4 text-[17px] font-medium">{c.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
        </article>
      ))}
    </div>
  );
}
