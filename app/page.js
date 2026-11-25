import Link from "next/link";
import Script from "next/script";
import { ArrowRight } from "lucide-react";
import Header, { PRIMARY_ACTION } from "@/components/header";
import { Logo } from "@/components/app/logo";
import { HeroCollage } from "@/components/landing/hero-collage";
import { AppWindow } from "@/components/landing/app-window";
import { Features } from "@/components/landing/features";
import { InsightsTour } from "@/components/landing/insights-tour";
import { checkUser } from "@/lib/checkUser";
import "./landing.css";

/*
  kind: software (personal finance app) · page type software
  deal: hero triptych · moment iris-opens (insights) · nav-cards -> nav-centre (no photographs) ·
        footer-columns · close-word · rhythm surface-pairs · buttons arrow · mark: the app's own logo
  palette: the client's own (warm neutral + deep teal), type: Inter (the client's)
*/

const FAQ = [
  ["Is Welth free?", "Yes. You can add accounts and transactions, set a budget and use the insights without paying."],
  ["Does it connect to my bank?", "Not yet. You enter balances and transactions yourself, scan receipts, or set them to repeat."],
  ["Which currencies does it show?", "USD, INR or EUR, chosen in Settings. Amounts are shown in that currency, not converted."],
  ["Is the AI giving financial advice?", "No. Ask Welth explains your own numbers in plain words; it is not a licensed advisor."],
  ["Who can see my data?", "Only you, after signing in. Each account, budget and transaction is tied to your login."],
];

const primaryBtn =
  "m-btn inline-flex items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground hover:bg-primary/90";

const h2 = "text-4xl font-medium tracking-[-0.02em] sm:text-5xl";

export default async function LandingPage() {
  await checkUser(); // creates the database user on first sign-in

  return (
    <div className="landing min-h-dvh bg-background" id="top">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-20"
      >
        Skip to content
      </a>
      <Header />

      <main id="main">
        {/* Hero: headline · collage · one button */}
        <section className="screen pt-24" data-enter aria-labelledby="hero-h">
          <div className="container grid items-center gap-6 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <h1 id="hero-h" className="text-[40px] font-medium leading-[1.04] tracking-[-0.025em] lg:text-[46px] xl:text-[48px]">
                <span className="enter-line"><span>Free budget</span></span>
                <span className="enter-line"><span>app for busy</span></span>
                <span className="enter-line"><span>people</span></span>
              </h1>
              <p className="enter-follow mt-4 text-base leading-6 text-muted-foreground">
                Add your accounts, log spending or scan a receipt, and see your budget pace in USD, INR or EUR.
              </p>
            </div>
            <div className="lg:col-span-6">
              <HeroCollage />
            </div>
            <div className="enter-follow flex lg:col-span-3 lg:justify-end" style={{ "--i": 1 }}>
              <Link href="/sign-up" className={`${primaryBtn} m-btn--xl h-14 w-full px-7 text-lg lg:h-16 lg:w-auto lg:text-xl`}>
                {PRIMARY_ACTION} <ArrowRight className="m-arrow h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* The app, big */}
        <section className="screen" aria-labelledby="app-h">
          <div className="container">
            <div className="mb-10 max-w-2xl">
              <h2 id="app-h" className={h2}>Every transaction in one window</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Search, filter and edit across checking and savings. Balances update the moment you save.
              </p>
            </div>
            <AppWindow />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="screen" aria-labelledby="features-h">
          <div className="container">
            <div className="mb-10 max-w-2xl">
              <h2 id="features-h" className={h2}>Budgets, receipts and recurring bills</h2>
              <p className="mt-4 text-lg text-muted-foreground">The parts of money tracking that usually need a spreadsheet.</p>
            </div>
            <Features />
          </div>
        </section>

        {/* Insights, on the surface ground, with the dealt moment */}
        <section
          id="insights"
          className="screen ground-surface"
          aria-labelledby="insights-h"
          data-moment="iris-opens"
          data-moment-opts='{"from": "base"}'
        >
          <div className="container">
            <div className="mb-10 max-w-2xl">
              <h2 id="insights-h" className={h2}>Insights in plain language</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Welth reads your last few months and tells you what they mean for the next one.
              </p>
            </div>
            <InsightsTour />
          </div>
        </section>

        {/* Questions */}
        <section id="faq" className="screen ground-surface" aria-labelledby="faq-h">
          <div className="container grid gap-6 lg:grid-cols-12">
            <h2 id="faq-h" className={`${h2} lg:col-span-4`}>Questions about Welth</h2>
            <dl className="divide-y border-y lg:col-span-8">
              {FAQ.map(([q, a]) => (
                <div key={q} className="grid gap-2 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-8">
                  <dt className="font-medium">{q}</dt>
                  <dd className="text-muted-foreground">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      {/* Close (close-word) and footer (footer-columns) */}
      <footer id="contact" className="closing overflow-hidden border-t">
        <div className="container pt-24">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h2 className={h2}>Start your budget this month</h2>
              <p className="mt-3 text-lg text-muted-foreground">Add one account and see your first insight in about five minutes.</p>
            </div>
            <Link href="/sign-up" className={`${primaryBtn} h-14 w-full px-7 text-lg sm:w-auto`}>
              {PRIMARY_ACTION} <ArrowRight className="m-arrow h-5 w-5" />
            </Link>
          </div>
          <p
            aria-hidden
            className="mt-16 select-none text-center text-[clamp(96px,24vw,360px)] font-semibold leading-[.8] tracking-[-0.06em] text-foreground/[.06]"
          >
            welth
          </p>
        </div>
        <div className="border-t">
          <div className="container grid grid-cols-12 gap-6 py-10 text-sm">
            <div className="col-span-12 sm:col-span-6">
              <Logo href="#top" />
              <p className="mt-3 max-w-xs text-muted-foreground">Personal finance tracking with insights in plain language.</p>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <p className="font-medium">Product</p>
              <ul className="mt-1 text-muted-foreground">
                <li><a href="#features" className="m-link inline-flex min-h-11 items-center hover:text-foreground">Features</a></li>
                <li><a href="#insights" className="m-link inline-flex min-h-11 items-center hover:text-foreground">Insights</a></li>
                <li><a href="#faq" className="m-link inline-flex min-h-11 items-center hover:text-foreground">Questions</a></li>
              </ul>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <p className="font-medium">Account</p>
              <ul className="mt-1 text-muted-foreground">
                <li><Link href="/sign-in" className="m-link inline-flex min-h-11 items-center hover:text-foreground">Log in</Link></li>
                <li><Link href="/sign-up" className="m-link inline-flex min-h-11 items-center hover:text-foreground">Create an account</Link></li>
              </ul>
            </div>
          </div>
          <div className="container border-t py-6 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Welth · Built by Dhruvil Galaiya
          </div>
        </div>
      </footer>

      <Script src="/assets/moments/moments.js" type="module" strategy="afterInteractive" />
    </div>
  );
}
