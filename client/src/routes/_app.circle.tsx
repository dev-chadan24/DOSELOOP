import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { UserPlus, Mail, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { StatusPill, type StatusTone } from "@/components/app/StatusPill";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher, updater } from "@/lib/api";

export const Route = createFileRoute("/_app/circle")({
  head: () => ({ meta: [{ title: "Family Circle — DoseLoop" }] }),
  component: Circle,
});

const statusText: Record<string, { tone: StatusTone; label: string }> = {
  "on-track": { tone: "on-track", label: "On track" },
  attention: { tone: "attention", label: "Needs a check-in" },
  quiet: { tone: "quiet", label: "Quietly fine" },
};

function Circle() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRel, setInviteRel] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["/family"],
    queryFn: () => fetcher("/family"),
  });

  const toggleShareMutation = useMutation({
    mutationFn: ({
      id,
      sharesMedication,
      sharesWellness,
    }: {
      id: string;
      sharesMedication: boolean;
      sharesWellness: boolean;
    }) => updater(`/family/${id}/permissions`, { sharesMedication, sharesWellness }, "PUT"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/family"] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      updater("/family/invite", { email: inviteEmail, relation: inviteRel }, "POST"),
    onSuccess: () => {
      setOpen(false);
      setInviteEmail("");
      setInviteRel("");
      queryClient.invalidateQueries({ queryKey: ["/family"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => updater(`/family/${id}`, {}, "DELETE"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/family"] });
    },
  });

  const toggleShare = (id: string, sharesMedication: boolean, sharesWellness: boolean) => {
    toggleShareMutation.mutate({
      id,
      sharesMedication,
      sharesWellness,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Closeness, not surveillance"
        title="Family Circle"
        description="Share exactly what you choose, with exactly who you choose. Revoke anytime — consent is non-negotiable."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="warm" size="lg">
                <UserPlus className="size-4" /> Invite member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite to your Circle</DialogTitle>
                <DialogDescription>
                  They'll only see what you grant — and you can change it whenever you like.
                </DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  inviteMutation.mutate();
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email">Email or invite link</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="family@email.com"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-rel">Relationship</Label>
                  <Input
                    id="invite-rel"
                    placeholder="Daughter, son, partner…"
                    value={inviteRel}
                    onChange={(e) => setInviteRel(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    <Mail className="size-4" />{" "}
                    {inviteMutation.isPending ? "Sending..." : "Send invite"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {members.map(
          (m: {
            id: string;
            name: string;
            status: string;
            initials: string;
            relation: string;
            role: string;
            statusLine: string;
            sharesMedication: boolean;
            sharesWellness: boolean;
          }) => {
            const s = statusText[m.status];
            return (
              <article
                key={m.id}
                className="animate-rise rounded-2xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <Avatar className="size-12">
                      <AvatarFallback className="bg-primary/12 text-base font-semibold text-primary">
                        {m.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{m.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {m.relation} · {m.role === "owner" ? "You manage their care" : "Caregiver"}
                      </p>
                    </div>
                  </div>
                  <StatusPill tone={s.tone}>{s.label}</StatusPill>
                </div>

                <p className="mt-4 rounded-xl bg-muted/50 p-3 text-sm text-foreground">
                  {m.statusLine}
                </p>

                <div className="mt-6 flex flex-col gap-3 rounded-xl bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`meds-${m.id}`} className="cursor-pointer font-medium">
                      Share Medications
                    </Label>
                    <Switch
                      id={`meds-${m.id}`}
                      checked={m.sharesMedication}
                      onCheckedChange={() =>
                        toggleShare(m.id, !m.sharesMedication, m.sharesWellness)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`well-${m.id}`} className="cursor-pointer font-medium">
                      Share Wellness
                    </Label>
                    <Switch
                      id={`well-${m.id}`}
                      checked={m.sharesWellness}
                      onCheckedChange={() =>
                        toggleShare(m.id, m.sharesMedication, !m.sharesWellness)
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="w-full">
                    Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeMutation.mutate(m.id)}
                  >
                    Remove
                  </Button>
                </div>
              </article>
            );
          },
        )}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          Circle members never see raw logs unless you explicitly grant it — only a synthesized,
          respectful status. You can leave a Circle or revoke any sharing instantly from Settings.
        </p>
      </div>
    </div>
  );
}
