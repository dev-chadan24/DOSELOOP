import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Pill,
  HeartPulse,
  Users,
  Sparkles,
  BarChart3,
  Bell,
  Settings,
  LifeBuoy,
  HeartHandshake,
  Plus,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";

const nav = [
  { to: "/dashboard", label: "Today", icon: LayoutDashboard },
  { to: "/medications", label: "Medications", icon: Pill },
  { to: "/wellness", label: "Wellness", icon: HeartPulse },
  { to: "/circle", label: "Family Circle", icon: Users },
  { to: "/assistant", label: "Assistant", icon: Sparkles },
  { to: "/analytics", label: "Insights", icon: BarChart3 },
] as const;

const secondaryNav = [
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/help", label: "Help & Feedback", icon: HeartHandshake },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const mobileNav = [
  { to: "/dashboard", label: "Today", icon: LayoutDashboard },
  { to: "/medications", label: "Meds", icon: Pill },
  { to: "/circle", label: "Circle", icon: Users },
  { to: "/assistant", label: "Assistant", icon: Sparkles },
] as const;

function RailLink({
  to,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: typeof Pill;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      title={label}
      className={cn(
        "group/link relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-[250ms]",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="overflow-hidden whitespace-nowrap opacity-0 transition-all duration-[250ms] group-hover:opacity-100">
        {label}
      </span>
    </Link>
  );
}

function RailBody({
  pathname,
  onNavigate,
  expanded,
}: {
  pathname: string;
  onNavigate?: () => void;
  expanded?: boolean;
}) {
  const isActive = (to: string) => pathname.startsWith(to);
  const { data: user } = useQuery({
    queryKey: ["/user/profile"],
    queryFn: () => fetcher("/user/profile"),
  });

  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <div className="flex items-center gap-2 px-1.5 py-2">
        <Link to="/" aria-label="DoseLoop home" className="shrink-0">
          <Logo showWordmark={!!expanded} />
        </Link>
        <div className="ml-auto overflow-hidden opacity-0 transition-opacity duration-[250ms] group-hover:opacity-100">
          <ThemeToggle />
        </div>
      </div>

      <nav className="mt-2 flex flex-col gap-1" aria-label="Primary">
        {nav.map((item) => (
          <RailLink key={item.to} {...item} active={isActive(item.to)} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="my-3 h-px bg-sidebar-border" />

      <nav className="flex flex-col gap-1" aria-label="Secondary">
        {secondaryNav.map((item) => (
          <RailLink key={item.to} {...item} active={isActive(item.to)} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto space-y-2">
        <Link
          to="/emergency"
          onClick={onNavigate}
          title="Emergency"
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm font-semibold text-destructive transition-colors duration-[250ms] hover:bg-destructive/10",
          )}
        >
          <LifeBuoy className="size-5 shrink-0" aria-hidden="true" />
          <span className="overflow-hidden whitespace-nowrap opacity-0 transition-opacity duration-[250ms] group-hover:opacity-100">
            Emergency
          </span>
        </Link>

        <Link
          to="/profile"
          onClick={onNavigate}
          title={user ? `${user.firstName} ${user.lastName}` : "Profile"}
          className="flex items-center gap-3 rounded-2xl bg-sidebar-accent/60 px-2 py-2 transition-colors duration-[250ms] hover:bg-sidebar-accent"
        >
          <Avatar className="size-9 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {user ? `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}` : "U"}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 overflow-hidden opacity-0 transition-opacity duration-[250ms] group-hover:opacity-100">
            <span className="block truncate text-sm font-semibold text-sidebar-foreground">
              {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
            </span>
            <span className="block truncate text-xs text-sidebar-foreground/60">Personal Plan</span>
          </span>
        </Link>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Desktop floating rail — icon-only, expands on hover */}
      <aside className="group fixed inset-y-3 left-3 z-30 hidden w-[72px] overflow-hidden rounded-3xl border border-sidebar-border bg-sidebar/90 shadow-float backdrop-blur-xl transition-[width] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:w-64 lg:block">
        <RailBody pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 lg:hidden">
        <Link to="/" aria-label="DoseLoop home">
          <Logo size="sm" />
        </Link>
        <ThemeToggle />
      </header>

      {/* Mobile drawer (full nav) */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="group animate-rise absolute inset-y-0 left-0 w-72 bg-sidebar shadow-lift">
            <div className="flex justify-end p-3">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <RailBody pathname={pathname} expanded onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-[92px]">
        <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          {children}
        </main>
      </div>

      {/* Mobile floating bottom nav with central Quick Action */}
      <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 lg:hidden">
        <nav
          className="glass relative flex w-full max-w-md items-center justify-between rounded-full border px-2 py-2 shadow-float"
          aria-label="Mobile"
        >
          {mobileNav.slice(0, 2).map((item) => (
            <MobileTab key={item.to} {...item} active={pathname.startsWith(item.to)} />
          ))}

          <Link
            to="/dashboard"
            aria-label="Quick log"
            className="grid size-14 shrink-0 -translate-y-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform duration-[250ms] active:scale-95"
          >
            <Plus className="size-6" />
          </Link>

          {mobileNav.slice(2).map((item) => (
            <MobileTab key={item.to} {...item} active={pathname.startsWith(item.to)} />
          ))}
        </nav>
      </div>
    </div>
  );
}

function MobileTab({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Pill;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[11px] font-medium transition-colors duration-[250ms]",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
      {label}
    </Link>
  );
}
