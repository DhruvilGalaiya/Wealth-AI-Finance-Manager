import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
        <rect x="2" y="8" width="3" height="6" rx="1" />
        <rect x="6.5" y="5" width="3" height="9" rx="1" />
        <rect x="11" y="2" width="3" height="12" rx="1" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", className }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-11 items-center gap-2", className)} aria-label="Welth home">
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight">welth</span>
    </Link>
  );
}
