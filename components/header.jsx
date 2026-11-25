import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <nav className="container flex h-16 items-center justify-between" aria-label="Main">
        <Logo />
        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how-it-works" className="hover:text-foreground">How it works</a>
        </div>
        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="ghost">Log in</Button>
            </SignInButton>
            <SignUpButton forceRedirectUrl="/dashboard">
              <Button>Get started</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Button asChild>
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
