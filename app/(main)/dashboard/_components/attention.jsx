import Link from "next/link";
import { AlertTriangle, ArrowRight, BellRing, CircleAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE = {
  negative: { icon: CircleAlert, className: "bg-negative/10 text-negative" },
  warning: { icon: AlertTriangle, className: "bg-warning/10 text-warning" },
  neutral: { icon: Info, className: "bg-muted text-muted-foreground" },
};

export function AttentionFeed({ items }) {
  if (!items.length) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
        <BellRing className="h-4 w-4" /> All clear. Nothing needs your attention right now.
      </div>
    );
  }

  return (
    <section aria-label="Needs attention" className="mb-6 overflow-hidden rounded-xl border bg-card">
      <ul className="divide-y">
        {items.map((item) => {
          const tone = TONE[item.tone];
          return (
            <li key={item.id}>
              <Link href={item.href} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
                <span className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full", tone.className)}>
                  <tone.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{item.text}</p>
                </div>
                <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary sm:inline-flex">
                  {item.action}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
