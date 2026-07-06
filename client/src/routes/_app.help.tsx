import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  Heart,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  Bug,
  Lightbulb,
  MessageCircle,
  LifeBuoy,
  HelpCircle,
} from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { updater } from "@/lib/api";

export const Route = createFileRoute("/_app/help")({
  head: () => ({
    meta: [
      { title: "Help & Feedback — DoseLoop" },
      {
        name: "description",
        content:
          "Share a bug, an idea, or your experience — your feedback shapes the future of DoseLoop.",
      },
    ],
  }),
  component: HelpFeedback,
});

const categories = [
  { value: "feature", label: "Feature Request", icon: Lightbulb },
  { value: "bug", label: "Bug Report", icon: Bug },
  { value: "feedback", label: "Feedback", icon: Heart },
  { value: "suggestion", label: "Suggestion", icon: Sparkles },
  { value: "account", label: "Account Support", icon: LifeBuoy },
  { value: "general", label: "General Inquiry", icon: MessageCircle },
] as const;

const feedbackSchema = z.object({
  name: z
    .string()
    .trim()
    .nonempty({ message: "Please share your name" })
    .max(100, { message: "Name must be under 100 characters" }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be under 255 characters" }),
  category: z.string().nonempty({ message: "Please choose a category" }),
  subject: z
    .string()
    .trim()
    .nonempty({ message: "Please add a subject" })
    .max(150, { message: "Subject must be under 150 characters" }),
  message: z
    .string()
    .trim()
    .nonempty({ message: "Please write a short message" })
    .max(2000, { message: "Message must be under 2000 characters" }),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof feedbackSchema>, string>>;

const SUPPORT_EMAIL = "doseloop2026@gmail.com";

function HelpFeedback() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = feedbackSchema.safeParse(form);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    const categoryValue = ["bug", "feature"].includes(form.category) ? form.category : "general";
    submitMutation.mutate({ category: categoryValue, text: form.message });
  };

  const submitMutation = useMutation({
    mutationFn: (data: { category: string; text: string }) => updater("/feedback", data, "POST"),
    onMutate: () => setStatus("sending"),
    onSuccess: () => setStatus("success"),
    onError: (err) => {
      console.error(err);
      setStatus("idle");
    },
  });

  const resetForm = () => {
    setForm({ name: "", email: "", category: "", subject: "", message: "" });
    setErrors({});
    setStatus("idle");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Help & Feedback"
        title="Help Us Improve DoseLoop ❤️"
        description="DoseLoop is constantly evolving. Whether you've found a bug, have an idea for a new feature, or simply want to share your experience, we'd love to hear from you. Your feedback directly influences future updates and helps us build a better health companion for everyone."
      />

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-start">
        {/* Feedback form — glass premium panel */}
        <section className="glass-card relative overflow-hidden rounded-3xl border border-border p-6 shadow-lift sm:p-8">
          <div
            className="surface-glow pointer-events-none absolute inset-0 opacity-70"
            aria-hidden="true"
          />

          {status === "success" ? (
            <div className="animate-rise relative flex flex-col items-center justify-center gap-4 py-14 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="size-9" />
              </span>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-semibold text-foreground">Message received ❤️</h2>
                <p className="mx-auto max-w-md text-muted-foreground">
                  Thank you, {form.name.split(" ")[0] || "friend"}. Your feedback is on its way to
                  our team — we read every message and it genuinely shapes what we build next.
                </p>
              </div>
              <Button variant="outline" size="lg" onClick={resetForm} className="mt-2">
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="relative space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full Name" htmlFor="name" error={errors.name}>
                  <Input
                    id="name"
                    placeholder="Ananya Iyer"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    aria-invalid={!!errors.name}
                    className="rounded-2xl"
                  />
                </Field>

                <Field label="Email Address" htmlFor="email" error={errors.email}>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ananya@example.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    aria-invalid={!!errors.email}
                    className="rounded-2xl"
                  />
                </Field>
              </div>

              <Field label="Category" htmlFor="category" error={errors.category}>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger
                    id="category"
                    className="rounded-2xl"
                    aria-invalid={!!errors.category}
                  >
                    <SelectValue placeholder="What's this about?" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <c.icon className="size-4 text-primary" />
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Subject" htmlFor="subject" error={errors.subject}>
                <Input
                  id="subject"
                  placeholder="A short headline for your message"
                  value={form.subject}
                  onChange={(e) => set("subject", e.target.value)}
                  aria-invalid={!!errors.subject}
                  className="rounded-2xl"
                />
              </Field>

              <Field label="Message" htmlFor="message" error={errors.message}>
                <Textarea
                  id="message"
                  rows={5}
                  placeholder="Tell us what's on your mind — the more detail, the better."
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  aria-invalid={!!errors.message}
                  className="resize-none rounded-2xl"
                />
              </Field>

              <Button
                type="submit"
                size="lg"
                disabled={status === "sending"}
                className="group w-full justify-center rounded-2xl text-base shadow-soft transition-all duration-250 hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0"
              >
                {status === "sending" ? (
                  <>
                    <Loader2 className="size-5 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="size-5 transition-transform duration-250 group-hover:translate-x-0.5" />
                    Send Feedback
                  </>
                )}
              </Button>
            </form>
          )}
        </section>

        {/* Side column: direct contact + appreciation */}
        <div className="space-y-6">
          <section className="neumorph rounded-3xl p-6 sm:p-7">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent-foreground">
              <HelpCircle className="size-6" />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Need Direct Assistance?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              If you'd prefer to contact us directly, we're always happy to help.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className={cn(
                "mt-5 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5",
                "shadow-soft transition-all duration-250 hover:-translate-y-0.5 hover:shadow-lift",
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Email us
                </span>
                <span className="block truncate font-medium text-foreground">{SUPPORT_EMAIL}</span>
              </span>
            </a>
          </section>

          <section className="rounded-3xl border border-primary/20 bg-primary/5 p-6 text-center sm:p-7">
            <span className="mx-auto grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
              <Heart className="size-5" />
            </span>
            <p className="mt-3 font-semibold text-foreground">Every message matters.</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Thank you for helping us make DoseLoop better for you, your family, and our growing
              community.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
