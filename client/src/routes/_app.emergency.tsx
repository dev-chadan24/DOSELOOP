import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Phone, MapPin, ShieldAlert, HeartPulse, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

export const Route = createFileRoute("/_app/emergency")({
  head: () => ({ meta: [{ title: "Emergency — DoseLoop" }] }),
  component: Emergency,
});

const medicalInfo = [
  { label: "Blood type", value: "O+" },
  { label: "Allergies", value: "Penicillin" },
  { label: "Conditions", value: "Hypertension, Type 2 Diabetes" },
  { label: "Current meds", value: "Lisinopril, Metformin, Atorvastatin" },
];

function Emergency() {
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["/emergency"],
    queryFn: () => fetcher("/emergency"),
  });

  const [sosStatus, setSosStatus] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newRelation, setNewRelation] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");

  const createContactMutation = useMutation({
    mutationFn: () =>
      updater("/emergency", { name: newName, relation: newRelation, phone: newPhone }, "POST"),
    onSuccess: () => {
      setAddOpen(false);
      setNewName("");
      setNewRelation("");
      setNewPhone("");
      queryClient.invalidateQueries({ queryKey: ["/emergency"] });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => updater(`/emergency/${id}`, {}, "DELETE"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/emergency"] });
    },
  });

  const sosMutation = useMutation({
    mutationFn: (payload: any) => updater("/emergency/sos", payload, "POST"),
    onSuccess: (res: any) => {
      const count = res?.data?.contactsNotified ?? 0;
      const emailsFailed = res?.data?.emailsFailed ?? 0;
      if (emailsFailed > 0) {
        setSosStatus(`SOS Alert Sent, but ${emailsFailed} email(s) failed to send. Notified ${count} contact(s).`);
      } else {
        setSosStatus(`SOS Alert Sent Successfully. Emergency alert sent to ${count} contact(s).`);
      }
    },
    onError: () => {
      setSosStatus("Failed to send SOS alert. Please try again or dial emergency services directly.");
    }
  });

  const handleConfirmSOS = () => {
    setSosStatus(null);
    if (!navigator.geolocation) {
      sosMutation.mutate({ timestamp: Date.now() });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        sosMutation.mutate({
          latitude,
          longitude,
          accuracy,
          mapsUrl,
          timestamp: Date.now(),
        });
      },
      (error) => {
        console.warn("Geolocation denied or failed:", error);
        sosMutation.mutate({ timestamp: Date.now() });
      },
      { timeout: 10000 }
    );
  };

  if (isLoading)
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Just in case"
        title="Emergency support"
        description="Calm, prepared, never alarmist. Reach the right person fast — without panic."
      />

      <section className="rounded-3xl border border-destructive/25 bg-destructive/5 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-destructive/12 text-destructive">
            <ShieldAlert className="size-6" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Need help right now?</h2>
            <p className="text-sm text-muted-foreground">
              Contact emergency services or notify your Circle.
            </p>
          </div>
        </div>
        {sosStatus && (
          <div className="mt-4 p-4 rounded-xl border border-border bg-background text-sm font-medium">
            {sosStatus}
          </div>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="lg"
                className="flex-1"
                disabled={sosMutation.isPending}
              >
                <Phone className="size-4" />{" "}
                {sosMutation.isPending ? "Processing..." : "Call emergency services"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Trigger SOS Alert?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will immediately notify all your emergency contacts. We will attempt to share your current location. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmSOS}>
                  Yes, send alert
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" size="lg" className="flex-1">
            <MapPin className="size-4" /> Share my location with Circle
          </Button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Phone className="size-5 text-primary" /> Emergency contacts
          </h2>
          <ul className="mt-5 space-y-3">
            {contacts.map((m: { id: string; name: string; relation: string; phone: string }) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary/12 text-sm font-semibold text-primary">
                      {m.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.relation}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Call ${m.name}`}
                    onClick={() => window.open(`tel:${m.phone}`)}
                  >
                    <Phone className="size-4" /> Call
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label={`Delete ${m.name}`}
                    onClick={() => deleteContactMutation.mutate(m.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
            <li>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-center">
                    <Plus className="size-4" /> Add emergency contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add emergency contact</DialogTitle>
                    <DialogDescription>
                      This person will be notified when you trigger an SOS alert.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      createContactMutation.mutate();
                    }}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-name">Name</Label>
                      <Input
                        id="contact-name"
                        placeholder="Jane Doe"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-relation">Relationship</Label>
                      <Input
                        id="contact-relation"
                        placeholder="Daughter, son, partner…"
                        required
                        value={newRelation}
                        onChange={(e) => setNewRelation(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-phone">Phone number</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        required
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createContactMutation.isPending}>
                        <Plus className="size-4" />{" "}
                        {createContactMutation.isPending ? "Adding..." : "Add contact"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <HeartPulse className="size-5 text-primary" /> Medical information
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Shared with first responders if you choose to grant access.
          </p>
          <dl className="mt-5 space-y-3">
            {medicalInfo.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 border-t border-border pt-3 first:border-t-0 first:pt-0"
              >
                <dt className="text-sm text-muted-foreground">{row.label}</dt>
                <dd className="text-right text-sm font-medium text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
