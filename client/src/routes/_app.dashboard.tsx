import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Clock,
  SkipForward,
  AlarmClockOff,
  Plus,
  Pill,
  Droplets,
  Smile,
  Meh,
  Frown,
  ArrowRight,
  Phone,
  IdCard,
  Hospital,
  Siren,
} from "lucide-react";

import { StatusPill } from "@/components/app/StatusPill";
import { HealthRing } from "@/components/app/HealthRing";
import { AiBadge } from "@/components/brand/AiBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type DoseStatus = "taken" | "skipped" | "snoozed" | "due" | "upcoming";

export interface FamilyPulse {
  id: string;
  name: string;
  relation: string;
  initials: string;
  mood: "great" | "okay" | "low";
  meds: "done" | "due" | "missed";
  hydration: number;
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher, updater } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Today — DoseLoop" }] }),
  component: Dashboard,
});

const statusLabel: Record<DoseStatus, string> = {
  taken: "Taken",
  skipped: "Skipped",
  snoozed: "Snoozed",
  due: "Due now",
  upcoming: "Upcoming",
};

function computeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const moodIcon = { great: Smile, okay: Meh, low: Frown } as const;
const moodTone = {
  great: "text-success",
  okay: "text-warning",
  low: "text-muted-foreground",
} as const;
const medsTone: Record<FamilyPulse["meds"], string> = {
  done: "bg-success/15 text-success",
  due: "bg-warning/15 text-warning-foreground",
  missed: "bg-destructive/12 text-destructive",
};

function Dashboard() {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
  } = useQuery({
    queryKey: ["/user/profile"],
    queryFn: () => fetcher("/user/profile"),
  });
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useQuery({
    queryKey: ["/dashboard/summary"],
    queryFn: () => fetcher("/dashboard/summary"),
  });
  const {
    data: doses,
    isLoading: dosesLoading,
    isError: dosesError,
  } = useQuery({
    queryKey: ["/doses/today"],
    queryFn: () => fetcher("/doses/today"),
  });

  const doseMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DoseStatus }) =>
      updater(`/doses/${id}`, { status }, "PUT"),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["/doses/today"] });
      const previousDoses = queryClient.getQueryData(["/doses/today"]);
      queryClient.setQueryData(["/doses/today"], (old: unknown) =>
        (old as { id: string }[])?.map((d: { id: string }) => (d.id === id ? { ...d, status } : d)),
      );
      return { previousDoses };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(["/doses/today"], context?.previousDoses);
    },
    onSettled: (data, error, variables) => {
      if (!error && variables.status === "taken") {
        trackEvent("reminder_completed");
      }
      queryClient.invalidateQueries({ queryKey: ["/doses/today"] });
      queryClient.invalidateQueries({ queryKey: ["/dashboard/summary"] });
    },
  });

  const [date, setDate] = useState(new Date());

  const [greeting, setGreeting] = useState("Good morning");
  useEffect(() => setGreeting(computeGreeting()), []);

  if (userLoading || summaryLoading || dosesLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;
  }

  if (userError || summaryError || dosesError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <p className="text-base font-medium text-foreground">Couldn't load your dashboard.</p>
          <p className="text-sm text-muted-foreground">
            Check that the server is running, then refresh the page.
          </p>
        </div>
      </div>
    );
  }

  if (!user || !summary || !doses) {
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;
  }

  const { familyHealthScore, nextDose, familyPulse, healthRings } = summary;
  const todaysDoses = doses;
  const taken = doses.filter((d: { status: string }) => d.status === "taken").length;
  const total = doses.length;

  const update = async (id: string, status: DoseStatus) => {
    doseMutation.mutate({ id, status });
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="surface-glow animate-rise relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 size-56 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                {greeting}
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-foreground sm:text-4xl">
                {greeting}, {user.firstName} 👋
              </h1>
              <p className="mt-2 max-w-xl text-base text-muted-foreground">
                You've logged {taken} of {total} doses today and the family is doing well. One calm
                tap at a time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
                  <Smile className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Family Health Score
                  </p>
                  <p className="font-numeric text-xl font-semibold text-foreground">
                    {familyHealthScore.score}
                    <span className="ml-1 text-sm font-medium text-success">
                      {familyHealthScore.delta}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3">
                <span className="grid size-10 place-items-center rounded-xl bg-warning/15 text-warning-foreground">
                  <Pill className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Next reminder
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {nextDose ? (
                      <>
                        {nextDose.medicationName} · {nextDose.time}
                        <span className="ml-1 font-normal text-muted-foreground">
                          {nextDose.inLabel}
                        </span>
                      </>
                    ) : (
                      <span className="text-success">All caught up! ✓</span>
                    )}
                  </p>
                </div>
              </div>

              <Button variant="warm" size="lg" className="card-interactive">
                <Plus className="size-4" /> Quick log
              </Button>
            </div>
          </div>

          {/* Activity rings */}
          <div className="flex items-center justify-center gap-4 rounded-2xl border border-border bg-muted/30 p-5">
            {healthRings.map(
              (r: {
                id: string;
                value: number;
                goal: number;
                label: string;
                unit: string;
                color: "primary" | "info" | "gold";
              }) => (
                <HealthRing
                  key={r.id}
                  value={r.value}
                  goal={r.goal}
                  label={r.label}
                  unit={r.unit}
                  color={r.color}
                />
              ),
            )}
          </div>
        </div>
      </section>

      {/* AI digest */}
      <section data-reveal className="rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <AiBadge label="Daily digest" />
          <span className="text-sm text-muted-foreground">8:00 AM</span>
        </div>
        <p className="mt-4 text-lg font-medium text-foreground sm:text-xl">
          You've logged {taken} of {total} doses so far — both blood-pressure medications are on
          schedule. Hydration is a little behind; a glass of water now would close the gap.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Generated from your own data. Tap any item to see what's behind it.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Doses timeline */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Today's doses</h2>
            <span className="text-sm font-medium text-muted-foreground">
              {taken}/{total} logged
            </span>
          </div>

          <ul className="stagger-children space-y-3">
            {doses.map(
              (dose: {
                id: string;
                medicationName: string;
                dosage: string;
                time: string;
                status: string;
                critical?: boolean;
              }) => {
                const done = dose.status === "taken" || dose.status === "skipped";
                return (
                  <li
                    key={dose.id}
                    className={cn(
                      "card-interactive neumorph rounded-2xl border p-4 transition-colors sm:p-5",
                      dose.status === "due" ? "border-warning/40" : "border-border",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-numeric grid size-11 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                          {dose.time}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">
                            {dose.medicationName}{" "}
                            <span className="font-normal text-muted-foreground">
                              · {dose.dosage}
                            </span>
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            {dose.critical && (
                              <span className="text-xs font-semibold text-primary">Critical</span>
                            )}
                            <StatusPill tone={dose.status as never}>
                              {statusLabel[dose.status as DoseStatus] ?? dose.status}
                            </StatusPill>
                          </div>
                        </div>
                      </div>

                      {!done && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => update(dose.id, "taken")}>
                            <Check className="size-4" /> Take
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => update(dose.id, "snoozed")}
                          >
                            <Clock className="size-4" /> Snooze
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label="Skip dose"
                            onClick={() => update(dose.id, "skipped")}
                          >
                            <SkipForward className="size-4" />
                          </Button>
                        </div>
                      )}
                      {dose.status === "taken" && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                          <Check className="size-4" /> Logged
                        </span>
                      )}
                      {dose.status === "skipped" && (
                        <Button size="sm" variant="ghost" onClick={() => update(dose.id, "taken")}>
                          <AlarmClockOff className="size-4" /> Undo
                        </Button>
                      )}
                    </div>
                  </li>
                );
              },
            )}
          </ul>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Family pulse */}
          <div data-reveal className="neumorph rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Family pulse
              </h2>
              <Link to="/circle" className="text-xs font-semibold text-primary hover:underline">
                View all
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {familyPulse.map((m: FamilyPulse) => {
                const Mood = moodIcon[m.mood];
                return (
                  <li key={m.id} className="flex items-center gap-3">
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback className="bg-accent/30 text-xs font-semibold text-foreground">
                        {m.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {m.name}{" "}
                        <span className="font-normal text-muted-foreground">· {m.relation}</span>
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                            medsTone[m.meds],
                          )}
                        >
                          {m.meds}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-info">
                          <Droplets className="size-3" /> {m.hydration}%
                        </span>
                      </div>
                    </div>
                    <Mood
                      className={cn("size-5 shrink-0", moodTone[m.mood])}
                      aria-label={`Mood ${m.mood}`}
                    />
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Emergency hub */}
          <div
            data-reveal
            data-reveal-delay="1"
            className="rounded-2xl border border-destructive/25 bg-destructive/5 p-6 shadow-soft"
          >
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-destructive/12 text-destructive">
                <Siren className="size-5" />
              </span>
              <h2 className="text-base font-semibold text-foreground">Emergency Hub</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { to: "/emergency", icon: Phone, label: "Contacts" },
                { to: "/emergency", icon: IdCard, label: "Medical ID" },
                { to: "/emergency", icon: Hospital, label: "Hospitals" },
              ].map((a) => (
                <Link
                  key={a.label}
                  to={a.to}
                  className="card-interactive flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground"
                >
                  <a.icon className="size-4 text-destructive" />
                  {a.label}
                </Link>
              ))}
              <Link
                to="/emergency"
                className="card-interactive flex items-center justify-center gap-2 rounded-xl bg-destructive px-3 py-2.5 text-sm font-semibold text-destructive-foreground"
              >
                <Siren className="size-4" /> SOS
              </Link>
            </div>
            <Link
              to="/emergency"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
            >
              Open Emergency Hub <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
