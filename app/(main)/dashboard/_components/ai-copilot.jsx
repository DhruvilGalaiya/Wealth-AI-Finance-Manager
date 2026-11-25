"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/app/section-card";
import { askCopilot } from "@/actions/gemini";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "How am I doing this month?",
  "Where can I cut back?",
  "How long would my savings last?",
];

export function AiCopilot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    const history = messages;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    const res = await askCopilot(question, history);
    setMessages((m) => [
      ...m,
      { role: "ai", text: res.success ? res.text : res.error, error: !res.success },
    ]);
    setLoading(false);
  };

  return (
    <SectionCard
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Ask Welth
        </span>
      }
      description="Questions about your money, answered with your real numbers."
      bodyClassName="flex flex-col"
    >
      <div ref={listRef} className="max-h-80 min-h-[120px] space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <p
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-muted",
                m.error && "text-negative"
              )}
            >
              {m.text}
            </p>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <form
        className="mt-4 flex items-center gap-2 rounded-xl border bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring/30"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="Ask anything about your finances…"
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Ask a question"
        />
        <Button type="submit" size="icon" className="h-8 w-8 rounded-lg" disabled={loading || !input.trim()} aria-label="Send">
          <ArrowUp />
        </Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">AI guidance, not professional financial advice.</p>
    </SectionCard>
  );
}
