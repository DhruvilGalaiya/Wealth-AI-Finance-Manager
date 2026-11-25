import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Header from "@/components/header";
import HeroSection from "@/components/hero";
import { Logo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { featuresData, howItWorksData } from "@/data/landing";
import { checkUser } from "@/lib/checkUser";

export default async function LandingPage() {
  await checkUser(); // creates the DB user on first sign-in

  return (
    <div className="min-h-dvh bg-background">
      <Header />
      <main>
        <HeroSection />

        <section id="features" className="border-t bg-card/50 py-20 sm:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight">Simple tools, done properly</h2>
              <p className="mt-3 text-muted-foreground">The essentials for staying on top of your money — without spreadsheets.</p>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {featuresData.map((f) => (
                <div key={f.title} className="bg-card p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 sm:py-24">
          <div className="container">
            <h2 className="text-center text-3xl font-semibold tracking-tight">Up and running in minutes</h2>
            <ol className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
              {howItWorksData.map((step, i) => (
                <li key={step.title} className="rounded-2xl border bg-card p-6">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="container pb-20 sm:pb-24">
          <div className="rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
            <h2 className="text-3xl font-semibold tracking-tight">Take control of your money today</h2>
            <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
              Free to use. Add an account and see your first insights in under five minutes.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link href="/dashboard">Create your account <ArrowRight /></Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} Welth. Built by Dhruvil Galaiya.</p>
        </div>
      </footer>
    </div>
  );
}
