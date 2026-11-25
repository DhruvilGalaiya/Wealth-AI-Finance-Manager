"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/app/section-card";
import { CURRENCIES, formatMoney } from "@/lib/currency";
import { updateCurrency } from "@/actions/settings";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function Option({ selected, onClick, disabled, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex items-center gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-60",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent"
      )}
    >
      {children}
      {selected && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}

export function SettingsForm({ currency: initialCurrency }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currency, setCurrency] = useState(initialCurrency);
  const [pending, startTransition] = useTransition();

  useEffect(() => setMounted(true), []);

  const chooseCurrency = (code) => {
    if (code === currency) return;
    const previous = currency;
    setCurrency(code);
    startTransition(async () => {
      const res = await updateCurrency(code);
      if (res.success) {
        toast.success(`Currency set to ${CURRENCIES[code].label}`);
        router.refresh();
      } else {
        setCurrency(previous);
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Currency"
        description="Changes how amounts are displayed. Existing amounts aren't converted."
      >
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Currency">
          {Object.values(CURRENCIES).map((c) => (
            <Option key={c.code} selected={currency === c.code} onClick={() => chooseCurrency(c.code)} disabled={pending}>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-base font-semibold">
                {c.symbol}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{c.code}</span>
                <span className="block truncate text-xs text-muted-foreground">{formatMoney(1234.5, c.code)}</span>
              </span>
            </Option>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Appearance" description="Choose a theme, or follow your device.">
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => (
            <Option key={t.value} selected={mounted && theme === t.value} onClick={() => setTheme(t.value)}>
              <t.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t.label}</span>
            </Option>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
