import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Target, Flame, Droplets, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { AiBadge } from "@/components/brand/AiBadge";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Insights — DoseLoop" }] }),
  component: Analytics,
});

function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["/dashboard/analytics"],
    queryFn: () => fetcher("/dashboard/analytics"),
  });

  if (isLoading)
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;
  if (!data) return null;

  const { stats, adherenceWeek } = data;
  const max = Math.max(...adherenceWeek.map((d: { total: number }) => d.total));
  const weeklyTotal = adherenceWeek.reduce((sum: number, d: { taken: number }) => sum + d.taken, 0);

  // Map icon names from strings back to components
  const iconMap: Record<string, React.ElementType> = { Target, Flame, Droplets, TrendingUp };
  const mappedStats = stats.map((s: { icon: string }) => ({
    ...s,
    icon: iconMap[s.icon] || Target,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Insights"
        title="Your trends, gently surfaced"
        description="Patterns over time — to understand your routine, never to judge it."
      />

      <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mappedStats.map(
          (s: {
            label: string;
            chip: string;
            icon: React.ElementType;
            value: string;
            sub: string;
          }) => (
            <div
              key={s.label}
              className="card-interactive rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <span className={`grid size-9 place-items-center rounded-xl ${s.chip}`}>
                <s.icon className="size-5" />
              </span>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <p className="font-numeric mt-1 text-3xl font-bold text-foreground">{s.value}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{s.sub}</p>
            </div>
          ),
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly bar chart */}
        <div className="animate-rise rounded-3xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Doses logged this week</h2>
            <span className="font-numeric rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              Weekly total: {weeklyTotal}
            </span>
          </div>

          <div className="relative mt-8 h-56">
            {/* baseline grid lines */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-px w-full bg-border/60" />
              ))}
            </div>

            <div className="relative flex h-full items-end justify-between gap-3">
              {adherenceWeek.map((d: { taken: number; total: number; day: string }) => {
                const h = Math.max(8, Math.round((d.taken / d.total) * 100) || 8);
                const full = d.taken === d.total && d.total > 0;
                return (
                  <div
                    key={d.day}
                    className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="font-numeric text-xs font-semibold text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {d.taken}/{d.total}
                    </span>
                    <div
                      className={`w-full max-w-10 rounded-t-lg transition-all duration-500 ${
                        full ? "bg-primary" : "bg-warning"
                      } group-hover:opacity-85`}
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-xs font-medium text-muted-foreground">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" /> All doses logged
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-warning" /> Some missed
            </span>
          </div>
        </div>

        {/* Premium AI insight card */}
        <div className="animate-rise relative overflow-hidden rounded-3xl bg-sidebar p-6 text-sidebar-foreground shadow-lift">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-10 size-40 rounded-full bg-accent/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                <Sparkles className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold text-sidebar-foreground">Weekly insight</h2>
                <AiBadge label="AI generated" className="mt-0.5" />
              </div>
            </div>

            <p className="mt-5 text-base font-medium leading-relaxed text-sidebar-foreground">
              Your strongest days are weekends. Friday evenings are when doses most often slip — a
              single reminder shift to 7:30 PM could lift your weekly adherence above 95%.
            </p>
            <p className="mt-3 text-sm text-sidebar-foreground/60">
              Based only on your logged doses this month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
