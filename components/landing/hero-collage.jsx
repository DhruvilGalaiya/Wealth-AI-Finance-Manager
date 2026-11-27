"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import {
  Piece, BalancePiece, BudgetPiece, SpendingPiece, ReceiptPiece, TxRows, RecurringPiece,
  ChatPiece, SafetyPiece, VerdictPiece,
} from "./ui-bits";
import { cn } from "@/lib/utils";

// Three sets of real Welth UI. Positions are % of the collage; pieces never cover each other's text.
// The last piece of every set ends at 96% x 96% and carries the pause disc on its corner.
const W = 628;
const H = 716;
const LAST = { right: "4%", bottom: "4%" };
const SETS = [
  [
    { el: <BalancePiece />, pos: { left: "4%", top: "4%", width: "62%" } },
    { el: <BudgetPiece />, pos: { right: "4%", top: "37%", width: "50%" } },
    { el: <SpendingPiece />, pos: { left: "4%", top: "59%", width: "48%" } },
    { el: <RecurringPiece />, pos: { ...LAST, width: "40%" } },
  ],
  [
    { el: <ReceiptPiece />, pos: { left: "4%", top: "4%", width: "54%" } },
    { el: <><p className="mb-2 text-[11px] text-muted-foreground">Recent transactions</p><TxRows /></>, pos: { right: "4%", top: "8%", width: "38%" } },
    { el: <BudgetPiece used={74} expected={57} />, pos: { left: "4%", top: "56%", width: "46%" } },
    { el: <RecurringPiece />, pos: { ...LAST, width: "42%" } },
  ],
  [
    { el: <ChatPiece />, pos: { left: "4%", top: "4%", width: "64%" } },
    { el: <VerdictPiece />, pos: { left: "4%", top: "39%", width: "46%" } },
    { el: <SafetyPiece />, pos: { right: "4%", top: "33%", width: "44%" } },
    { el: <BalancePiece />, pos: { ...LAST, width: "50%" } },
  ],
];

export function HeroCollage() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 639px)");
    const update = () => setStill(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || still) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % SETS.length), 2800);
    return () => clearInterval(id);
  }, [paused, still]);

  const shown = still ? 0 : index;

  // Lay the collage out at its design size and scale it as one picture to the frame.
  const frameRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setScale(Math.min(width / W, height / H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className="enter-media relative mx-auto aspect-[628/716] w-full max-w-[628px] max-sm:max-w-[320px]"
      aria-label="Examples of Welth screens"
      role="img"
    >
      <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-b from-primary/[.07] to-transparent" aria-hidden />
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
        {SETS.map((set, i) => (
          <div key={i} className={cn("collage-set absolute inset-0", i === shown ? "is-shown opacity-100" : "pointer-events-none opacity-0")} aria-hidden={i !== shown}>
            {set.map((p, j) => (
              <Piece key={j} className="absolute" style={p.pos}>{p.el}</Piece>
            ))}
          </div>
        ))}
      </div>
      {!still && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? "Play the screen examples" : "Pause the screen examples"}
          className="m-btn absolute bottom-[calc(4%-22px)] right-[calc(4%-22px)] z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm hover:text-foreground"
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
