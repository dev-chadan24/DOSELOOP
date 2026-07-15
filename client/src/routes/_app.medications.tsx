import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pill, Clock, AlertCircle, Pencil, Package } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher, updater } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/_app/medications")({
  head: () => ({ meta: [{ title: "Medications — DoseLoop" }] }),
  component: Medications,
});

function Medications() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ["/medications"],
    queryFn: () => fetcher("/medications"),
  });

  if (isLoading)
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Your regimen"
        title="Medications"
        description="Add a medication once — DoseLoop handles the reminders and adherence from there."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="warm" size="lg">
                <Plus className="size-4" /> Add medication
              </Button>
            </DialogTrigger>
            <AddMedicationDialog onClose={() => setOpen(false)} />
          </Dialog>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {medications.length === 0 && (
          <div className="col-span-full text-center p-12 border border-dashed rounded-2xl text-muted-foreground">
            No medications added yet.
          </div>
        )}
        {medications.map(
          (med: {
            id: string;
            color: string;
            name: string;
            dosage: string;
            form: string;
            schedule: string;
            critical: boolean;
            refillIn: number;
            notes: string;
          }) => (
            <article
              key={med.id}
              className="animate-rise rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-lift"
            >
              <div className="flex items-start justify-between">
                <span
                  className="grid size-12 place-items-center rounded-2xl"
                  style={{
                    background: `color-mix(in oklab, ${med.color} 14%, transparent)`,
                    color: med.color,
                  }}
                >
                  <Pill className="size-6" />
                </span>
                {/* TODO(analytics): When medication edit/delete mutations are implemented, add trackEvent("medication_updated") and trackEvent("medication_deleted") in their onSuccess callbacks. */}
                <Button variant="ghost" size="icon" aria-label={`Edit ${med.name}`}>
                  <Pencil className="size-4" />
                </Button>
              </div>

              <h2 className="mt-4 text-xl font-semibold text-foreground">
                {med.name}{" "}
                <span className="text-base font-normal text-muted-foreground">{med.dosage}</span>
              </h2>
              <p className="text-sm text-muted-foreground">{med.form}</p>

              <div className="mt-4 space-y-2 text-sm">
                <p className="flex items-center gap-2 text-foreground">
                  <Clock className="size-4 text-muted-foreground" />
                  {med.schedule}
                </p>
                {med.critical && (
                  <p className="flex items-center gap-2 font-medium text-primary">
                    <AlertCircle className="size-4" />
                    Critical · Circle can be notified if missed
                  </p>
                )}
                <p
                  className={cn(
                    "flex items-center gap-2",
                    (med.refillIn ?? 99) <= 7
                      ? "font-medium text-warning-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <Package className="size-4" />
                  Refill in {med.refillIn} days
                </p>
              </div>

              {med.notes && (
                <p className="mt-4 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                  {med.notes}
                </p>
              )}
            </article>
          ),
        )}
      </div>
    </div>
  );
}

function AddMedicationDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    form: "PILL",
    frequency: "daily",
    firstTime: "08:00",
    critical: false,
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: (data: {
      name: string;
      dosage: string;
      form: string;
      critical: boolean;
      notes: string;
      schedule: string;
      times: string[];
    }) => updater("/medications", data, "POST"),
    onSuccess: () => {
      trackEvent("medication_created");
      // TODO(analytics): If reminders become independently created (separate from medications), add trackEvent("reminder_created") to that flow.
      queryClient.invalidateQueries({ queryKey: ["/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/dashboard/summary"] });
      onClose();
    },
  });

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Add a medication</DialogTitle>
        <DialogDescription>
          Just the essentials — you can fine-tune the schedule later.
        </DialogDescription>
      </DialogHeader>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({
            name: formData.name,
            dosage: formData.dosage,
            form: formData.form,
            critical: formData.critical,
            notes: formData.notes,
            schedule: formData.frequency,
            times: [formData.firstTime],
          });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="m-name">Name</Label>
          <Input
            id="m-name"
            placeholder="e.g. Lisinopril"
            required
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="m-dose">Dosage</Label>
            <Input
              id="m-dose"
              placeholder="10 mg"
              required
              value={formData.dosage}
              onChange={(e) => setFormData((p) => ({ ...p, dosage: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-form">Form</Label>
            <Input
              id="m-form"
              placeholder="PILL"
              value={formData.form}
              onChange={(e) => setFormData((p) => ({ ...p, form: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="m-freq">Frequency</Label>
            <Input
              id="m-freq"
              placeholder="daily"
              value={formData.frequency}
              onChange={(e) => setFormData((p) => ({ ...p, frequency: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-time">First time</Label>
            <Input
              id="m-time"
              type="time"
              required
              value={formData.firstTime}
              onChange={(e) => setFormData((p) => ({ ...p, firstTime: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-notes">Instructions or notes</Label>
          <Textarea
            id="m-notes"
            placeholder="e.g. Take with food"
            value={formData.notes}
            onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="m-crit">Mark as critical</Label>
            <p className="text-xs text-muted-foreground">
              Circle members are alerted if this is missed.
            </p>
          </div>
          <Switch
            id="m-crit"
            checked={formData.critical}
            onCheckedChange={(c) => setFormData((p) => ({ ...p, critical: c }))}
          />
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Adding..." : "Add medication"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
