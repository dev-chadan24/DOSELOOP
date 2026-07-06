import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft, Pill, Users, Bell, Check, HeartPulse } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Get started — DoseLoop" }] }),
  component: Onboarding,
});

const steps = [
  {
    icon: HeartPulse,
    title: "Who are we caring for?",
    subtitle: "Start with yourself — you can add family to your Circle later.",
  },
  {
    icon: Pill,
    title: "Add your first medication",
    subtitle: "Just the essentials. You can refine the schedule any time.",
  },
  {
    icon: Bell,
    title: "How should we remind you?",
    subtitle: "Calm by default. One shared daily budget, never noise.",
  },
  {
    icon: Users,
    title: "You're all set",
    subtitle: "Your loop is ready. Invite family whenever you're comfortable.",
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [reminder, setReminder] = useState("push");
  const last = step === steps.length - 1;
  const Current = steps[step].icon;

  const next = () => (last ? navigate({ to: "/dashboard" }) : setStep((s) => s + 1));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">Skip for now</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-10">
        {/* Progress */}
        <div className="mb-10 flex items-center gap-2" aria-hidden="true">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>

        <div className="animate-rise space-y-7">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Current className="size-7" />
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-foreground">{steps[step].title}</h1>
            <p className="text-muted-foreground">{steps[step].subtitle}</p>
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" defaultValue="Ayush Iyer" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">What brings you here?</Label>
                <Input id="role" defaultValue="Managing my own medications" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="med">Medication name</Label>
                <Input id="med" placeholder="e.g. Lisinopril" defaultValue="Lisinopril" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dose">Dosage</Label>
                  <Input id="dose" placeholder="10 mg" defaultValue="10 mg" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" type="time" defaultValue="08:00" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {[
                { id: "push", label: "Push notifications", hint: "Gentle, one-tap to log" },
                { id: "inapp", label: "In-app only", hint: "Quiet — check on your own time" },
                { id: "digest", label: "Daily digest only", hint: "One calm summary each morning" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReminder(opt.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors",
                    reminder === opt.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30",
                  )}
                >
                  <span>
                    <span className="block font-semibold text-foreground">{opt.label}</span>
                    <span className="block text-sm text-muted-foreground">{opt.hint}</span>
                  </span>
                  {reminder === opt.id && (
                    <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-4" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="rounded-2xl border border-success/25 bg-success/8 p-6">
              <span className="grid size-12 place-items-center rounded-full bg-success text-success-foreground">
                <Check className="size-6" />
              </span>
              <p className="mt-4 font-medium text-foreground">
                Your first reminder is scheduled for 8:00 AM tomorrow. We'll keep it calm — promise.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="size-4" /> Back
              </Button>
            )}
            <Button onClick={next} size="lg" className="ml-auto">
              {last ? "Go to my dashboard" : "Continue"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
