import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Heart, Users, Sparkles, Check } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher, updater } from "@/lib/api";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — DoseLoop" }] }),
  component: Notifications,
});

const toneMeta = {
  reminder: { icon: Bell, color: "bg-warning/15 text-warning-foreground" },
  gentle: { icon: Heart, color: "bg-info/12 text-info" },
  circle: { icon: Users, color: "bg-primary/12 text-primary" },
  digest: { icon: Sparkles, color: "bg-success/12 text-success" },
} as const;

function Notifications() {
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["/notifications"],
    queryFn: () => fetcher("/notifications"),
  });

  const items = Array.isArray(data) ? data : [];
  const unread = items.filter((n: { unread: boolean }) => n.unread).length;

  const markAllMutation = useMutation({
    mutationFn: () => updater("/notifications/read-all", {}, "PUT"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/notifications"] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => updater(`/notifications/${id}/read`, {}, "PUT"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/notifications"] });
    },
  });

  const markAll = () => markAllMutation.mutate();
  const markOne = (id: string) => markOneMutation.mutate(id);

  if (isLoading)
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Every alert here is actionable or reassuring — one shared daily budget, never noise."
        action={
          unread > 0 ? (
            <Button variant="outline" onClick={markAll}>
              <Check className="size-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      <ul className="space-y-3">
        {items.length === 0 && (
          <div className="text-center text-muted-foreground p-8 border border-dashed rounded-xl">
            No notifications yet.
          </div>
        )}
        {items.map(
          (n: {
            id: string;
            unread: boolean;
            tone: string;
            title: string;
            time: string;
            body: string;
          }) => {
            const meta = toneMeta[n.tone as keyof typeof toneMeta] || toneMeta.gentle;
            return (
              <li key={n.id}>
                <button
                  onClick={() => markOne(n.id)}
                  className={cn(
                    "flex w-full items-start gap-4 rounded-2xl border p-5 text-left shadow-soft transition-colors",
                    n.unread ? "border-primary/25 bg-primary/[0.04]" : "border-border bg-card",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-xl",
                      meta.color,
                    )}
                  >
                    <meta.icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">{n.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{n.time}</span>
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">{n.body}</span>
                  </span>
                  {n.unread && (
                    <span
                      className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary"
                      aria-label="Unread"
                    />
                  )}
                </button>
              </li>
            );
          },
        )}
      </ul>
    </div>
  );
}
