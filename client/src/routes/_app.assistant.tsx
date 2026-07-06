import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, Sparkles, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { AiBadge } from "@/components/brand/AiBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const assistantSuggestions = [
  "How can I adjust to my new medication?",
  "What foods should I avoid with Lisinopril?",
  "How does DoseLoop's family feature work?",
];
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher, updater } from "@/lib/api";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/assistant")({
  head: () => ({ meta: [{ title: "Assistant — DoseLoop" }] }),
  component: Assistant,
});

function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["/ai/history"],
    queryFn: () => fetcher("/ai/history"),
  });

  // Sync loaded history to local state
  useEffect(() => {
    if (history.length > 0 && messages.length === 0) {
      setMessages(
        history.map((h: { id: string; role: string; content: string }) => ({
          id: h.id ?? crypto.randomUUID(),
          role: h.role === "ASSISTANT" ? "assistant" : ("user" as "user" | "assistant"),
          content: h.content,
        })),
      );
    }
  }, [history, messages.length]);

  const aiMutation = useMutation({
    mutationFn: (userMessage: string) =>
      updater("/ai/chat", { message: userMessage }, "POST"),
    onSuccess: (
      res: { success: boolean; data: { message: string; fromApi: boolean } },
    ) => {
      const reply = res?.data?.message ?? "No response received.";
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
      };
      setMessages((prev) => [...prev, aiMsg]);
    },
    onError: () => {
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    },
  });

  const send = (text: string) => {
    const value = text.trim();
    if (!value) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: value };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    aiMutation.mutate(value);
  };

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-6 lg:h-[calc(100vh-5rem)]">
      <PageHeader
        eyebrow="Your assistant"
        title="Ask about your own health data"
        description="Calm, scoped to you, and never diagnostic. Every answer is clearly AI-generated."
      />

      <div className="flex min-h-0 flex-1 flex-col rounded-3xl border border-border bg-card shadow-soft">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <AiBadge label="DoseLoop Assistant" />
          <span className="text-xs text-muted-foreground">
            No diagnosis · no prescriptions · your data only
          </span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%]",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-secondary/50 text-foreground",
                )}
              >
                {m.role === "assistant" && (
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Sparkles className="size-3" /> AI
                  </span>
                )}
                {m.content}
              </div>
            </div>
          ))}
          {aiMutation.isPending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%] border border-border bg-secondary/50 text-foreground flex items-center gap-2">
                <Sparkles className="size-3 animate-pulse text-primary" /> Thinking...
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {assistantSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your adherence, doses, or habits…"
              aria-label="Message the assistant"
            />
            <Button type="submit" size="icon" aria-label="Send message" disabled={!input.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="size-4 shrink-0 text-muted-foreground" />
        DoseLoop's assistant shares information, not medical advice. In an emergency, contact your
        local emergency services.
      </p>
    </div>
  );
}
