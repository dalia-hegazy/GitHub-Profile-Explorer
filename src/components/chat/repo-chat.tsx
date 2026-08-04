"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownContent } from "@/components/markdown-content";

export interface RepoChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RepoChatProps {
  owner: string;
  repo: string;
  initialMessages?: RepoChatMessage[];
}

function ChatBubble({ message }: { message: RepoChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <MarkdownContent
            content={message.content}
            className="prose prose-sm max-w-none dark:prose-invert [&_pre]:whitespace-pre-wrap [&_pre]:break-words"
          />
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        role="status"
        aria-label="Assistant is typing"
        className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2.5"
      >
        <span className="size-1.5 animate-bounce rounded-full bg-foreground/60" />
        <span className="size-1.5 animate-bounce rounded-full bg-foreground/60 [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-foreground/60 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export function RepoChat({
  owner,
  repo,
  initialMessages = [],
}: RepoChatProps) {
  const [messages, setMessages] = useState<RepoChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || isStreaming) return;

    const userMessage: RepoChatMessage = { role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsStreaming(true);

    try {
      const response = await fetch(
        `/api/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages }),
        },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "The request failed.");
      }
      if (!response.body) {
        throw new Error("The response contained no stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((current) => {
          const copy = [...current];
          copy[copy.length - 1] = { role: "assistant", content: assistantText };
          return copy;
        });
      }
      setMessages((current) => {
        const copy = [...current];
        copy[copy.length - 1] = {
          role: "assistant",
          content: assistantText,
        };
        return copy;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setMessages((current) => current.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-96 min-h-48 flex-col gap-3 overflow-y-auto rounded-lg border border-input p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ask a question about this repository, grounded in its README,
            languages, and recent commits.
          </p>
        ) : (
          messages.map((message, index) => (
            <ChatBubble key={index} message={message} />
          ))
        )}
        {isStreaming && messages.at(-1)?.role === "user" ? <TypingIndicator /> : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about this repo…"
          aria-label="Ask about this repository"
          rows={3}
          maxLength={4000}
        />
        <Button type="submit" disabled={isStreaming || input.trim().length === 0}>
          {isStreaming ? (
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-current" />
              Streaming…
            </span>
          ) : (
            "Send"
          )}
        </Button>
      </form>
    </div>
  );
}
