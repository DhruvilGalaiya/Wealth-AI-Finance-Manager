"use client";

import { useRef, useState, useLayoutEffect } from "react";
import { Piece, SafetyPiece, VerdictPiece, ChatPiece, CategoryIconBubble } from "./ui-bits";
import { AlertTriangle, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

function UnusualPiece() {
  return (
    <>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5" /> Unusual spending · last 90 days</div>
      <ul className="mt-3 divide-y text-[12px]">
        {[["Flight to Lisbon", "Travel", "Oct 12", "$612.00"], ["New laptop stand", "Shopping", "Nov 4", "$189.00"]].map(([n, c, d, a]) => (
          <li key={n} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
            <CategoryIconBubble icon={Plane} color="#0ea5e9" />
            <div className="min-w-0 flex-1"><p className="font-medium">{n}</p><p className="text-[11px] text-muted-foreground">{d} · {c}</p></div>
            <span className="font-medium tabular">{a}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

const TABS = [
  { id: "safety", label: "Safety net", text: "How many days your cash would last at your usual spending.", el: <SafetyPiece /> },
  { id: "unusual", label: "Unusual spending", text: "Purchases far above your normal, flagged from the last 90 days.", el: <UnusualPiece /> },
  { id: "afford", label: "Can I afford it?", text: "Type an amount and see your budget and safety net after it.", el: <VerdictPiece /> },
  { id: "ask", label: "Ask Welth", text: "Questions in plain English, answered with your own numbers.", el: <ChatPiece /> },
];

export function InsightsTour() {
  const [active, setActive] = useState(0);
  const listRef = useRef(null);
  const [bar, setBar] = useState({ x: 0, w: 0 });

  useLayoutEffect(() => {
    const el = listRef.current?.children[active];
    if (el) setBar({ x: el.offsetLeft, w: el.offsetWidth });
  }, [active]);

  const onKey = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = (active + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setActive(next);
    listRef.current?.children[next]?.focus();
  };

  return (
    <div>
      <div className="relative -mx-1 overflow-x-auto px-1 pb-1">
        <div ref={listRef} role="tablist" aria-label="Insights" className="relative inline-flex gap-1 rounded-full border bg-card p-1" onKeyDown={onKey}>
          <span
            aria-hidden
            className="absolute inset-y-1 left-0 rounded-full bg-foreground transition-[transform,width] [transition-duration:240ms] [transition-timing-function:cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(${bar.x}px)`, width: bar.w }}
          />
          {TABS.map((t, i) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={i === active}
              aria-controls={`panel-${t.id}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                "relative z-10 min-h-11 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors",
                i === active ? "text-background" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid items-center gap-6 md:h-[320px] md:grid-cols-12 [&>div>p]:md:col-span-6 [&>div>div]:md:col-span-6">
        {TABS.map((t, i) => (
          <div
            key={t.id}
            role="tabpanel"
            id={`panel-${t.id}`}
            aria-labelledby={`tab-${t.id}`}
            hidden={i !== active}
            className={i === active ? "contents" : "hidden"}
          >
            <p className="max-w-sm text-lg text-muted-foreground">{t.text}</p>
            <Piece className="card w-full p-5">{t.el}</Piece>
          </div>
        ))}
      </div>
    </div>
  );
}
