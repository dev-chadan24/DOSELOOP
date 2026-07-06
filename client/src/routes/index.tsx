import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Pill,
  Users,
  Sparkles,
  HeartPulse,
  ShieldCheck,
  Bell,
  ArrowRight,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AiBadge } from "@/components/brand/AiBadge";
import heroImage from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DoseLoop — Calm family health, together" },
      {
        name: "description",
        content:
          "DoseLoop keeps families gently in sync on medications, wellness, and peace of mind — proactive, private, and beautifully simple.",
      },
      { property: "og:title", content: "DoseLoop — Calm family health, together" },
      {
        property: "og:description",
        content: "An AI-powered family health companion built around trust, not surveillance.",
      },
      { property: "og:image", content: heroImage },
      { name: "twitter:image", content: heroImage },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Pill,
    title: "Medications that never slip",
    body: "Add a medication once. DoseLoop reminds at the right moment and logs taken, skipped, or snoozed in a single tap.",
  },
  {
    icon: Users,
    title: "A Circle, not surveillance",
    body: "Invite family into your Circle and share exactly what you choose — per person, per data type, revocable anytime.",
  },
  {
    icon: Sparkles,
    title: "Proactive, not noisy",
    body: "A calm daily digest and gentle nudges that surface what matters — never engagement bait, always clearly labeled.",
  },
  {
    icon: HeartPulse,
    title: "Wellness in one place",
    body: "Water, sleep, mood, and habits for the whole household — one shared rhythm instead of five scattered apps.",
  },
];

const principles = [
  "Consent is non-negotiable — you own what's shared",
  "Calm over clever, in every screen and notification",
  "Built for everyone, including a legible, large-tap experience",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="glass sticky top-0 z-30 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#circle" className="transition-colors hover:text-foreground">
              Family Circle
            </a>
            <a href="#trust" className="transition-colors hover:text-foreground">
              Trust
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/onboarding">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="surface-glow relative overflow-hidden">
        <div
          className="pointer-events-none absolute -left-24 top-10 size-80 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 -top-10 size-72 rounded-full bg-accent/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 size-72 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="animate-rise space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm font-medium text-muted-foreground shadow-soft">
              <ShieldCheck className="size-4 text-primary" />
              Peace of mind is the product
            </span>
            <h1 className="text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
              Calm family health, <span className="text-primary">held together.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              DoseLoop helps you and the people you love stay on top of medications and daily
              wellness — with gentle reminders, a private family Circle, and an assistant that
              reassures instead of nags.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero" size="lg">
                <Link to="/onboarding">
                  Start your loop
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/dashboard">See the dashboard</Link>
              </Button>
            </div>
            <ul className="grid gap-2 pt-2">
              {principles.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <span className="grid size-5 place-items-center rounded-full bg-success/15 text-success">
                    <Check className="size-3.5" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-rise-slow relative">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lift">
              <img
                src={heroImage}
                alt="A family held gently within a continuous loop of care"
                width={1280}
                height={1024}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-border bg-card p-4 shadow-lift sm:block">
              <AiBadge label="Daily digest" />
              <p className="mt-2 max-w-[14rem] text-sm font-medium text-foreground">
                "Dad's on track today — both blood-pressure doses taken."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl" data-reveal>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              What DoseLoop does
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
              Everything a family needs, nothing it doesn't.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {features.map((f, i) => (
              <div
                key={f.title}
                data-reveal
                data-reveal-delay={(i % 4) + 1}
                className="card-interactive group rounded-2xl border border-border bg-card p-7 shadow-soft"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <f.icon className="size-6" />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Circle */}
      <section id="circle" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-5" data-reveal>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Family Circle
            </p>
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
              Closeness without looking over a shoulder.
            </h2>
            <p className="text-lg text-muted-foreground">
              Ananya sees that her father is on track today — not his raw logs. Ayush stays fully in
              control of what he shares, and can change his mind at any time. That's the whole
              point: reassurance, never surveillance.
            </p>
            <Button asChild variant="warm">
              <Link to="/circle">
                Explore the Circle
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {[
              {
                name: "Dad — Ayush",
                line: "On track today · both critical doses taken",
                tone: "bg-success/12 text-success",
              },
              {
                name: "Wife — Sunita",
                line: "Missed her morning dose · a check-in may help",
                tone: "bg-warning/15 text-warning-foreground",
              },
              {
                name: "Rohan",
                line: "Quietly fine · sharing wellness only",
                tone: "bg-muted text-muted-foreground",
              },
            ].map((row, i) => (
              <div
                key={row.name}
                data-reveal
                data-reveal-delay={i + 1}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <span className="font-semibold text-foreground">{row.name}</span>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${row.tone}`}>
                  {row.line}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="border-t border-border bg-primary/5">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6" data-reveal>
          <span className="grid size-14 place-items-center mx-auto rounded-2xl bg-primary/12 text-primary">
            <Bell className="size-7" />
          </span>
          <h2 className="mt-6 text-3xl font-semibold text-foreground sm:text-4xl">
            A reminder you can actually trust.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Every notification is actionable or reassuring — never ambient noise. One shared daily
            budget means you're gently kept in the loop, not buried in alerts.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="hero" size="lg">
              <Link to="/onboarding">Get started — it's free</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link to="/assistant">Meet the assistant</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DoseLoop · Built around trust, not noise.
          </p>
        </div>
      </footer>
    </div>
  );
}
