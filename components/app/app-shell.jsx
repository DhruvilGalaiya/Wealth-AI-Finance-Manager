"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  Settings,
  Plus,
  Menu,
  CalendarClock,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { QuickAddDialog, useQuickAddShortcut } from "@/components/app/quick-add";
import { Logo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight, match: ["/transaction"] },
  { href: "/accounts", label: "Accounts", icon: Landmark, match: ["/account"] },
  { href: "/plan", label: "Plan", icon: CalendarClock },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname, item) {
  const prefixes = [item.href, ...(item.match || [])];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function SidebarContent({ user, onNavigate, onQuickAdd }) {
  const pathname = usePathname();
  const navRef = useRef(null);
  const [indicator, setIndicator] = useState(null);

  useLayoutEffect(() => {
    const el = navRef.current?.querySelector("[data-active]");
    setIndicator(el ? { y: el.offsetTop, h: el.offsetHeight } : null);
  }, [pathname]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo href="/dashboard" />
      </div>

      <div className="px-3">
        <Button className="w-full justify-start" onClick={onQuickAdd}>
          <Sparkles /> Quick add
          <kbd className="ml-auto rounded bg-primary-foreground/15 px-1.5 py-0.5 text-[11px] font-medium">⌘K</kbd>
        </Button>
      </div>

      <nav ref={navRef} className="relative mt-4 flex-1 space-y-0.5 px-3" aria-label="Main">
        {/* One indicator that slides to the current page instead of jumping */}
        {indicator && (
          <span
            aria-hidden
            className="absolute inset-x-3 top-0 rounded-lg bg-card shadow-sm ring-1 ring-border transition-transform duration-300 [transition-timing-function:cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
            style={{ height: indicator.h, transform: `translateY(${indicator.y}px)` }}
          />
        )}
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              data-active={active || undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                active ? "text-foreground" : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4 transition-colors", active && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t px-5 py-4">
        <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ user, rules = [], children }) {
  const [open, setOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);
  const pathname = usePathname();
  useQuickAddShortcut(setQuickAdd);
  const openQuickAdd = () => {
    setOpen(false);
    setQuickAdd(true);
  };

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-sidebar lg:block">
        <SidebarContent user={user} onQuickAdd={openQuickAdd} />
      </aside>

      {/* Mobile top bar */}
      <header className="material sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 px-4 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <Logo href="/dashboard" />
        <Button size="icon" aria-label="Quick add a transaction" onClick={openQuickAdd}>
          <Plus />
        </Button>
      </header>

      <Dialog open={open} onOpenChange={setOpen}>
        <SheetContent aria-describedby={undefined}>
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <SidebarContent user={user} onNavigate={() => setOpen(false)} onQuickAdd={openQuickAdd} />
        </SheetContent>
      </Dialog>

      <QuickAddDialog open={quickAdd} onOpenChange={setQuickAdd} rules={rules} />

      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
