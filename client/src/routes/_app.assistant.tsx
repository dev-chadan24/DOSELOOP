import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, Sparkles, ShieldAlert, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { PageHeader } from "@/components/app/PageHeader";
import { AiBadge } from "@/components/brand/AiBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher, updater } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const assistantSuggestions = [
  "What foods should I avoid with Lisinopril?",
  "What are symptoms of dehydration?",
  "How does the Family Circle feature work?",
  "What are the side effects of Metformin?",
];

export const Route = createFileRoute("/_app/assistant")({
  head: () => ({ meta: [{ title: "Assistant — DoseLoop" }] }),
  component: Assistant,
});

// ---------------------------------------------------------------------------
// Markdown message bubble — renders AI responses with proper formatting
// ---------------------------------------------------------------------------
function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-2 mt-3 text-base font-bold text-foreground first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-1.5 mt-3 text-sm font-semibold text-foreground first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1 mt-2 text-sm font-semibold text-muted-foreground first:mt-0">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-2 text-sm leading-relaxed last:mb-0">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 ml-4 list-disc space-y-1 text-sm last:mb-0">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 ml-4 list-decimal space-y-1 text-sm last:mb-0">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-muted-foreground">{children}</em>
        ),
        hr: () => <hr className="my-3 border-border" />,
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-2 border-primary pl-3 text-sm italic text-muted-foreground">
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <pre className="my-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              <code>{children}</code>
            </pre>
          ) : (
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
              {children}
            </code>
          );
        },
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/50">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-semibold text-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-t border-border px-3 py-2 text-muted-foreground">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ---------------------------------------------------------------------------
// Main Assistant page
// ---------------------------------------------------------------------------
function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["/ai/history"],
    queryFn: () => fetcher("/ai/history"),
  });

  // Sync loaded history to local state on first load
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

  // Track chat start
  useEffect(() => {
    trackEvent("ai_chat_started");
  }, []);

  // Auto-scroll to bottom whenever a new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const aiMutation = useMutation({
    mutationFn: (userMessage: string) =>
      updater("/ai/chat", { message: userMessage }, "POST"),
    onSuccess: (
      res: { success: boolean; data: { message: string; fromApi: boolean } },
    ) => {
      const reply = res?.data?.message ?? "No response received.";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Unable to connect to the assistant service. Please try again in a moment.",
        },
      ]);
    },
  });

  const send = (text: string) => {
    const value = text.trim();
    if (!value || aiMutation.isPending) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: value },
    ]);
    setInput("");
    trackEvent("ai_message_sent");
    aiMutation.mutate(value);
  };

  const handleClear = () => {
    setMessages([]);
    queryClient.invalidateQueries({ queryKey: ["/ai/history"] });
  };

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4 lg:h-[calc(100vh-5rem)]">
      <PageHeader
        eyebrow="Your assistant"
        title="Ask about your health & medications"
        description="Evidence-based, structured responses. Never diagnostic."
      />

      <div className="flex min-h-0 flex-1 flex-col rounded-3xl border border-border bg-card shadow-soft">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <AiBadge label="Pulse AI" />
            <span className="text-xs text-muted-foreground">
              No diagnosis · no prescriptions
            </span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Clear conversation"
            >
              <RotateCcw className="size-3" />
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && !isLoading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Ask Pulse AI anything
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Medications, symptoms, healthy habits, or app features
                </p>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[75%]",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground text-sm leading-relaxed"
                    : "border border-border bg-secondary/30 text-foreground",
                )}
              >
                {m.role === "assistant" && (
                  <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Sparkles className="size-3" /> Pulse AI
                  </span>
                )}
                {m.role === "assistant" ? (
                  <MarkdownMessage content={m.content} />
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {aiMutation.isPending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                <Sparkles className="size-3 animate-pulse text-primary" />
                <span className="text-xs text-muted-foreground">Thinking…</span>
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 animate-bounce rounded-full bg-primary/50"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions + Input */}
        <div className="border-t border-border p-4">
          {messages.length === 0 && (
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
          )}
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
              placeholder="Ask about medications, symptoms, or features…"
              aria-label="Message the assistant"
              disabled={aiMutation.isPending}
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Send message"
              disabled={!input.trim() || aiMutation.isPending}
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="size-4 shrink-0 text-muted-foreground" />
        Pulse AI provides health information, not medical advice. In an emergency, contact your local emergency services immediately.
      </p>
    </div>
  );
}
