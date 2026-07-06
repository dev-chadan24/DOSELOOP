import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Lock, Sparkles, LogOut, Moon, HeartHandshake } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher, updater } from "@/lib/api";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — DoseLoop" }] }),
  component: Settings,
});

interface Toggle {
  id: string;
  label: string;
  hint: string;
  on: boolean;
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-1">{children}</div>
    </section>
  );
}

function ToggleRow({ t, onChange }: { t: Toggle; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border py-3.5 first:border-t-0">
      <div>
        <p className="text-sm font-medium text-foreground">{t.label}</p>
        <p className="text-sm text-muted-foreground">{t.hint}</p>
      </div>
      <Switch checked={t.on} onCheckedChange={onChange} />
    </div>
  );
}

function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/user/profile"],
    queryFn: () => fetcher("/user/profile"),
  });

  const prefsMutation = useMutation({
    mutationFn: (prefs: Record<string, unknown>) => updater("/settings/preferences", prefs, "PUT"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/user/profile"] });
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => fetcher("/settings/export"),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "doseloop_export.json";
      a.click();
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => updater("/settings/account", {}, "DELETE"),
    onSuccess: async () => {
      await signOut();
      navigate({ to: "/" });
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };
  const [groups, setGroups] = useState<Record<string, Toggle[]>>({
    notifications: [
      {
        id: "push",
        label: "Push reminders",
        hint: "Medication reminders at scheduled times",
        on: true,
      },
      { id: "digest", label: "Daily digest", hint: "One calm summary each morning", on: true },
      {
        id: "escalation",
        label: "Critical escalation",
        hint: "Notify a Circle member if a critical dose is missed twice",
        on: true,
      },
    ],
    ai: [
      {
        id: "nudges",
        label: "Proactive AI nudges",
        hint: "Gentle, occasional — independent of core reminders",
        on: true,
      },
      {
        id: "labels",
        label: "Always label AI content",
        hint: "Required for transparency — cannot be disabled",
        on: true,
      },
    ],
    privacy: [
      {
        id: "share-meds",
        label: "Share medication status",
        hint: "Synthesized status only, per Circle member",
        on: true,
      },
      {
        id: "share-wellness",
        label: "Share wellness",
        hint: "Water, sleep, mood trends",
        on: false,
      },
    ],
  });

  const update = (group: string, id: string, value: boolean) => {
    // Optimistically update the UI state if needed, but here we just map it to our backend
    if (id === "push") prefsMutation.mutate({ pushNotifications: value });
    if (id === "digest") prefsMutation.mutate({ emailNotifications: value });
    if (id === "share-meds") prefsMutation.mutate({ privacyEnabled: value });

    setGroups((prev) => ({
      ...prev,
      [group]: prev[group].map((t) => (t.id === id ? { ...t, on: value } : t)),
    }));
  };

  if (isLoading)
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Calm by default. You stay in control of every notification and every byte of shared data."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Section
          icon={Bell}
          title="Notifications"
          description="One shared daily budget keeps things quiet"
        >
          {groups.notifications.map((t) => (
            <ToggleRow key={t.id} t={t} onChange={(v) => update("notifications", t.id, v)} />
          ))}
        </Section>

        <Section
          icon={Sparkles}
          title="AI assistant"
          description="Transparent, scoped, never diagnostic"
        >
          {groups.ai.map((t) => (
            <ToggleRow key={t.id} t={t} onChange={(v) => update("ai", t.id, v)} />
          ))}
        </Section>

        <Section icon={Lock} title="Privacy & sharing" description="Consent is non-negotiable">
          {groups.privacy.map((t) => (
            <ToggleRow key={t.id} t={t} onChange={(v) => update("privacy", t.id, v)} />
          ))}
        </Section>

        <Section icon={Moon} title="Appearance & account" description="Make DoseLoop yours">
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">Larger text & tap targets</p>
              <p className="text-sm text-muted-foreground">Optimized for easy reading</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="border-t border-border pt-4">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => navigate({ to: "/help" })}
            >
              <HeartHandshake className="size-4" /> Help &amp; Feedback
            </Button>
          </div>
          <div className="pt-3">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              Export Personal Data
            </Button>
          </div>
          <div className="pt-3">
            <Button
              variant="outline"
              className="w-full justify-center text-destructive hover:bg-destructive/5"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
          <div className="pt-3">
            <Button
              variant="outline"
              className="w-full justify-center text-destructive bg-destructive/10 hover:bg-destructive/20 border-destructive/20"
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to delete your account? This action is permanent and cannot be undone.",
                  )
                ) {
                  deleteAccountMutation.mutate();
                }
              }}
              disabled={deleteAccountMutation.isPending}
            >
              Delete Account
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}
