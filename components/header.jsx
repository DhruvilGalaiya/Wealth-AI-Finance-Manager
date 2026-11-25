import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/app/logo";

export const PRIMARY_ACTION = "Start tracking free";

const btn =
  "m-btn inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium";

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b bg-background">
      <nav className="container grid h-16 grid-cols-[1fr_auto] items-center md:grid-cols-3" aria-label="Main">
        <Logo href="#top" />
        <div className="hidden items-center justify-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="m-link hover:text-foreground">Features</a>
          <a href="#insights" className="m-link hover:text-foreground">Insights</a>
          <a href="#faq" className="m-link hover:text-foreground">Questions</a>
        </div>
        <div className="flex items-center justify-end gap-1">
          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <button className={`${btn} text-muted-foreground hover:text-foreground max-sm:hidden`}>Log in</button>
            </SignInButton>
            <Link href="/sign-up" className={`${btn} bg-primary text-primary-foreground hover:bg-primary/90`}>
              {PRIMARY_ACTION} <ArrowRight className="m-arrow h-4 w-4" />
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className={`${btn} bg-primary text-primary-foreground hover:bg-primary/90`}>
              Open your dashboard <ArrowRight className="m-arrow h-4 w-4" />
            </Link>
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
