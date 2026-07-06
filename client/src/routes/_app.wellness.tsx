import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher, updater } from "@/lib/api";

export const Route = createFileRoute("/_app/wellness")({
  head: () => ({ meta: [{ title: "Wellness — DoseLoop" }] }),
  component: Wellness,
});

const moods = ["😔", "😕", "😐", "🙂", "😄"];

function Wellness() {
  const queryClient = useQueryClient();
  const [localMood, setLocalMood] = useState(3);
  const [localWater, setLocalWater] = useState(0);

  const { data: history = { moods: [], waterLogs: [] }, isLoading } = useQuery({
    queryKey: ["/wellness/history"],
    queryFn: () => fetcher("/wellness/history"),
  });

  const moodMutation = useMutation({
    mutationFn: (moodValue: number) =>
      updater("/wellness/metric", {
        label: "Mood",
        icon: "smile",
        value: moodValue,
        unit: "scale",
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/wellness/history"] });
    },
  });

  const waterMutation = useMutation({
    mutationFn: (amountMl: number) => updater("/wellness/water", { amountMl }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/wellness/history"] });
    },
  });

  const stepWater = (delta: number) => {
    const newVal = Math.max(0, localWater + delta);
    setLocalWater(newVal);
    waterMutation.mutate(newVal); // In real app, we might want to debounce this
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Daily wellness"
        title="A gentle rhythm of self-care"
        description="Quick-log water, sleep, and mood for yourself and your household — one place, no nagging."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="animate-rise rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2.5 font-semibold text-foreground">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                💧
              </span>
              Water Intake
            </span>
            <span className="text-sm text-muted-foreground">Goal 2000 ml</span>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => stepWater(-250)}>
              <Minus className="size-4" />
            </Button>
            <span className="text-center">
              <span className="block text-4xl font-semibold text-foreground">{localWater}</span>
              <span className="text-sm text-muted-foreground">ml</span>
            </span>
            <Button variant="outline" size="icon" onClick={() => stepWater(250)}>
              <Plus className="size-4" />
            </Button>
          </div>
          <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70 transition-all"
              style={{ width: `${Math.min(100, (localWater / 2000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Mood */}
        <div className="animate-rise rounded-2xl border border-border bg-card p-6 shadow-soft sm:col-span-2">
          <span className="font-semibold text-foreground">How are you feeling today?</span>
          <div className="mt-5 flex items-center justify-between gap-2">
            {moods.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setLocalMood(i);
                  moodMutation.mutate(i);
                }}
                aria-label={`Mood ${i + 1} of 5`}
                className={cn(
                  "grid size-12 place-items-center rounded-full text-2xl transition-all sm:size-14",
                  localMood === i
                    ? "bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20 scale-110"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
