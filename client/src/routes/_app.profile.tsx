import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Pill, Users, Flame, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — DoseLoop" }] }),
  component: Profile,
});

function Profile() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/user/profile"],
    queryFn: () => fetcher("/user/profile"),
  });
  const { data: medications = [], isLoading: medsLoading } = useQuery({
    queryKey: ["/medications"],
    queryFn: () => fetcher("/medications"),
  });
  const { data: members = [], isLoading: memsLoading } = useQuery({
    queryKey: ["/family"],
    queryFn: () => fetcher("/family"),
  });

  if (userLoading || medsLoading || memsLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;
  }

  const stats = [
    {
      icon: Pill,
      label: "Medications",
      value: medications.length,
      chip: "bg-primary/12 text-primary",
      tile: "border-primary/15 bg-primary/5",
    },
    {
      icon: Users,
      label: "Circle members",
      value: members.length,
      chip: "bg-accent/20 text-accent-foreground",
      tile: "border-accent/20 bg-accent/8",
    },
    {
      icon: Flame,
      label: "Day streak",
      value: 12, // Needs real calculation from backend eventually, hardcoded for now until backend supports it
      chip: "bg-warning/20 text-warning-foreground",
      tile: "border-warning/25 bg-warning/8",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="animate-rise overflow-hidden rounded-3xl border border-border bg-card shadow-lift">
        {/* Gradient cover with title on it */}
        <div className="relative h-40 bg-[linear-gradient(120deg,var(--color-primary),var(--color-accent)_55%,var(--color-gold))]">
          <div className="absolute inset-0 bg-[radial-gradient(60%_120%_at_15%_0%,rgba(255,255,255,0.18),transparent_70%)]" />
          <div className="absolute left-6 top-6">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              Account
            </p>
            <h1 className="text-2xl font-semibold text-white">Your profile</h1>
          </div>
        </div>

        <div className="px-6 pb-8 sm:px-8">
          {/* Identity block */}
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="relative">
              <Avatar className="size-24 rounded-2xl border-4 border-card shadow-lift">
                <AvatarFallback className="rounded-2xl bg-primary text-2xl font-semibold text-primary-foreground">
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 size-6 rounded-full border-4 border-card bg-success" />
            </div>
            <Button className="rounded-xl shadow-soft transition-all duration-250 hover:-translate-y-0.5 hover:shadow-lift">
              <Pencil className="size-4" /> Edit profile
            </Button>
          </div>

          <div className="mt-5 mb-8">
            <h2 className="text-2xl font-semibold text-foreground">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-4" /> {user?.email}
            </p>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`card-interactive flex flex-col items-center justify-center rounded-2xl border ${s.tile} p-4 text-center`}
              >
                <span className={`mb-2 grid size-9 place-items-center rounded-xl ${s.chip}`}>
                  <s.icon className="size-5" />
                </span>
                <span className="font-numeric text-2xl font-bold leading-none text-foreground">
                  {s.value}
                </span>
                <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-foreground">Quick links</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button asChild variant="outline" className="justify-start">
            <Link to="/settings">Privacy &amp; sharing settings</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link to="/medications">Manage medications</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link to="/circle">Manage Family Circle</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link to="/notifications">Notification inbox</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
