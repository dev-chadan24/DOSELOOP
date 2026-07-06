import { createFileRoute, Outlet, useRouterState, Navigate } from "@tanstack/react-router";

import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/AuthProvider";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!session) {
    return <Navigate to="/auth" />;
  }

  return (
    <AppShell>
      {/* Keyed wrapper gives each route a calm fade-up entrance transition */}
      <div key={pathname} className="animate-rise">
        <Outlet />
      </div>
    </AppShell>
  );
}
