"use client";

import Link from "next/link";
import {
  Bot,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

const ASSISTANT_API_URL =
  process.env.NEXT_PUBLIC_AI_ASSISTANT_URL || "http://localhost:8000";
const SUGGESTED_QUESTIONS = [
  "What services do you offer?",
  "Show me perfume animation projects",
  "Recommend a product visualization project",
];
const ICON_BUTTON_CLASS =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors duration-200 hover:bg-white/10 hover:text-white active:bg-violet-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101015] motion-reduce:transition-none";

interface AssistantProject {
  title: string;
  category: string;
  slug: string;
  href: string;
}

interface AssistantLink {
  label: string;
  href: string;
}

interface AssistantReply {
  answer: string;
  projects?: AssistantProject[];
  links?: AssistantLink[];
}

interface ConversationMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  projects?: AssistantProject[];
  links?: AssistantLink[];
  welcome?: boolean;
}

interface FailedRequest {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

const WELCOME_MESSAGE: ConversationMessage = {
  id: 0,
  role: "assistant",
  content:
    "Hello. I can help you explore Ahad Animates, its services, and published portfolio work.",
  welcome: true,
};

function safeAssistantHref(href: string): string | null {
  const internalPath =
    /^\/(?:#(?:work|services|about|contact|daily-work)|daily-work(?:[?#][A-Za-z0-9_=%&.-]*)?|work\/[a-z0-9]+(?:-[a-z0-9]+)*(?:[?#][A-Za-z0-9_=%&.-]*)?)$/;
  const studioEmail = /^mailto:ahadanimates@gmail\.com(?:\?[A-Za-z0-9_=%&.-]*)?$/i;
  if (internalPath.test(href) || studioEmail.test(href)) return href;
  return null;
}

function renderAssistantText(text: string) {
  const internalLinkPattern =
    /\[([^\]]+)\]\((\/(?:#(?:work|services|about|contact|daily-work)|daily-work(?:[?#][A-Za-z0-9_=%&.-]*)?|work\/[a-z0-9]+(?:-[a-z0-9]+)*(?:[?#][A-Za-z0-9_=%&.-]*)?))\)|(?<![A-Za-z0-9:])(\/(?:#(?:work|services|about|contact|daily-work)|daily-work(?:[?#][A-Za-z0-9_=%&.-]*)?|work\/[a-z0-9]+(?:-[a-z0-9]+)*(?:[?#][A-Za-z0-9_=%&.-]*)?))/gi;
  const segments: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = internalLinkPattern.exec(text)) !== null) {
    const [, markdownLabel, markdownHref, plainHref] = match;
    const label = markdownLabel || plainHref;
    const href = markdownHref || plainHref;
    if (!label || !href) continue;
    const safeHref = safeAssistantHref(href);
    if (!safeHref) continue;
    if (match.index > cursor) {
      segments.push(text.slice(cursor, match.index));
    }
    segments.push(
      <Link
        className="text-violet-200 underline decoration-violet-300/40 underline-offset-4 hover:text-white focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
        href={safeHref}
        key={`${match.index}-${safeHref}`}
      >
        {label}
      </Link>,
    );
    cursor = match.index + match[0].length;
  }

  if (cursor === 0) return text;
  if (cursor < text.length) segments.push(text.slice(cursor));
  return segments;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") {
    return "The request was cancelled. You can retry when you're ready.";
  }
  if (error instanceof Error && error.name === "TimeoutError") {
    return "The assistant took too long to respond. Please retry.";
  }
  if (error instanceof TypeError) {
    return "The assistant service is offline or unreachable. Start FastAPI and retry.";
  }
  return error instanceof Error
    ? error.message
    : "The assistant could not complete that request.";
}

export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([
    WELCOME_MESSAGE,
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [lastFailedRequest, setLastFailedRequest] =
    useState<FailedRequest | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
    else if (wasOpenRef.current) launcherRef.current?.focus();
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [messages, isLoading, requestError]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function requestReply(request: FailedRequest): Promise<void> {
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);
    setIsLoading(true);
    setRequestError("");
    setLastFailedRequest(null);
    try {
      const response = await fetch(`${ASSISTANT_API_URL}/api/chat`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => null)) as
        | AssistantReply
        | { detail?: string }
        | null;
      if (!response.ok) {
        const detail =
          data && "detail" in data && typeof data.detail === "string"
            ? data.detail
            : data && "message" in data && typeof data.message === "string"
              ? data.message
              : undefined;
        throw new Error(
          detail || `Assistant request failed (HTTP ${response.status}).`,
        );
      }
      if (!data || !("answer" in data) || !data.answer.trim()) {
        throw new Error("The assistant returned an empty response.");
      }
      setMessages((current) => [
        ...current,
        {
          id: Date.now(),
          role: "assistant",
          content: data.answer,
          projects: data.projects,
          links: data.links,
        },
      ]);
      setAnnouncement("Assistant replied.");
    } catch (error) {
      if (controller.signal.aborted && requestControllerRef.current !== controller) {
        return;
      }
      setRequestError(
        controller.signal.aborted
          ? "The assistant took too long to respond. Please retry."
          : errorMessage(error),
      );
      setLastFailedRequest(request);
      setAnnouncement("The assistant request failed.");
    } finally {
      window.clearTimeout(timeoutId);
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        setIsLoading(false);
      }
    }
  }

  async function sendMessage(value: string): Promise<void> {
    const message = value.trim();
    if (!message || isLoading || message.length > 2000) return;

    const history: FailedRequest["history"] = [];
    let historyCharacters = 0;
    for (const item of messages.filter((entry) => !entry.welcome).slice(-10).reverse()) {
      if (historyCharacters + item.content.length > 12000) break;
      history.unshift({ role: item.role, content: item.content });
      historyCharacters += item.content.length;
    }
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", content: message },
    ]);
    setInput("");
    await requestReply({ message, history });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  function clearChat(): void {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setIsLoading(false);
    setRequestError("");
    setLastFailedRequest(null);
    setAnnouncement("Conversation cleared.");
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] sm:bottom-7 sm:right-7">
      {isOpen && (
        <section
          aria-label="Ahad Animates AI assistant"
          aria-modal="false"
          className="mb-3 flex h-[min(680px,calc(100dvh-6.25rem))] w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101015]/95 shadow-2xl shadow-black/60 ring-1 ring-violet-400/10 backdrop-blur-2xl sm:mb-4 sm:h-[min(680px,calc(100dvh-7rem))] sm:w-[min(420px,calc(100vw-3.5rem))]"
          role="dialog"
        >
          <header className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.025] px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-200">
                <Sparkles aria-hidden="true" size={19} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Ahad Animates
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Studio &amp; portfolio assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                aria-label="Clear conversation"
                className={ICON_BUTTON_CLASS}
                onClick={clearChat}
                type="button"
              >
                <Trash2 aria-hidden="true" className="block" size={18} />
              </button>
              <button
                aria-label="Close assistant"
                className={ICON_BUTTON_CLASS}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="block" size={18} />
              </button>
            </div>
          </header>

          <div
            aria-label="Conversation"
            aria-live="polite"
            className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5"
            ref={messageListRef}
            role="log"
          >
            {messages.map((message) => (
              <div
                className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                key={message.id}
              >
                {message.role === "assistant" && (
                  <div
                    aria-hidden="true"
                    className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-200"
                  >
                    <Bot size={15} />
                  </div>
                )}
                <div
                  className={`max-w-[88%] break-words rounded-2xl px-4 py-3 sm:max-w-[85%] ${message.role === "user" ? "rounded-br-md bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-lg shadow-violet-950/30" : "rounded-bl-md border border-white/[0.07] bg-white/[0.035] text-zinc-200"}`}
                >
                  <p className="whitespace-pre-wrap text-[13px] leading-6">
                    {message.role === "assistant"
                      ? renderAssistantText(message.content)
                      : message.content}
                  </p>
                  {message.projects && message.projects.length > 0 && (
                    <div className="mt-3 space-y-2.5">
                      {message.projects
                        .filter(
                          (project) =>
                            /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug) &&
                            project.href === `/work/${project.slug}`,
                        )
                        .map((project) => (
                          <Link
                            className="group/card flex min-h-11 flex-col justify-center rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 transition-colors duration-200 hover:border-violet-300/40 hover:bg-violet-400/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 motion-reduce:transition-none"
                            href={project.href}
                            key={project.slug}
                          >
                            <span className="block text-xs font-semibold text-white group-hover/card:text-violet-100">
                              {project.title}
                            </span>
                            <span className="mt-1 block text-[11px] text-zinc-400">
                              {project.category} · View project
                            </span>
                          </Link>
                        ))}
                    </div>
                  )}
                  {message.links && message.links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.links
                        .map((link) => ({
                          ...link,
                          safeHref: safeAssistantHref(link.href),
                        }))
                        .filter(
                          (link): link is AssistantLink & { safeHref: string } =>
                            link.safeHref !== null,
                        )
                        .map((link) => (
                          <Link
                            className="inline-flex min-h-10 items-center justify-center rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-[11px] font-medium text-violet-200 transition-colors duration-200 hover:border-violet-300/40 hover:bg-violet-400/20 hover:text-white active:bg-violet-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 motion-reduce:transition-none"
                            href={link.safeHref}
                            key={link.href}
                          >
                            {link.label}
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {messages.length === 1 && !isLoading && (
              <div className="ml-9 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                  Suggested questions
                </p>
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    className="block min-h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-left text-xs leading-5 text-zinc-300 transition-colors duration-200 hover:border-violet-300/40 hover:bg-violet-400/[0.08] hover:text-white active:bg-violet-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101015] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    disabled={isLoading}
                    key={question}
                    onClick={() => void sendMessage(question)}
                    type="button"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div
                aria-label="Assistant is responding"
                className="flex items-center gap-2.5 text-xs text-zinc-500"
                role="status"
              >
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin text-violet-300 motion-reduce:animate-none"
                  size={16}
                />
                <span>Thinking…</span>
              </div>
            )}
            {requestError && (
              <div
                className="ml-9 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-xs leading-5 text-rose-200"
                role="alert"
              >
                <p>{requestError}</p>
                {lastFailedRequest && (
                  <button
                    className="mt-2 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 font-semibold text-rose-100 underline decoration-rose-200/40 underline-offset-4 transition-colors duration-200 hover:bg-rose-300/10 hover:text-white active:bg-rose-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101015] motion-reduce:transition-none"
                    onClick={() => void requestReply(lastFailedRequest)}
                    type="button"
                  >
                    <RotateCcw aria-hidden="true" className="block" size={15} />
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>

          <form
            className="border-t border-white/[0.08] bg-black/10 p-3"
            onSubmit={handleSubmit}
          >
            <label className="sr-only" htmlFor="assistant-message">
              Message the assistant
            </label>
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2 focus-within:border-violet-300/40">
              <textarea
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-white outline-none placeholder:text-zinc-600"
                id="assistant-message"
                maxLength={2000}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Ask about the studio or projects…"
                ref={inputRef}
                rows={1}
                value={input}
              />
              <button
                aria-label="Send message"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white transition-colors duration-200 hover:bg-violet-400 active:bg-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101015] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                disabled={!input.trim() || isLoading}
                type="submit"
              >
                <Send aria-hidden="true" className="block" size={17} />
              </button>
            </div>
            <p aria-live="polite" className="sr-only">
              {announcement}
            </p>
            <p className="mt-2 text-center text-[10px] text-zinc-600">
              Answers are grounded in public studio and portfolio information.
            </p>
          </form>
        </section>
      )}

      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
        className="ml-auto inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-violet-300/25 bg-[#17141f]/95 px-4 text-sm font-semibold text-white shadow-xl shadow-black/40 backdrop-blur-xl transition-colors duration-200 hover:border-violet-300/60 hover:bg-[#292137] active:bg-[#332748] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080b] motion-reduce:transition-none sm:min-h-14 sm:px-5"
        onClick={() => setIsOpen((current) => !current)}
        ref={launcherRef}
        type="button"
      >
        {isOpen ? (
          <X aria-hidden="true" className="block" size={18} />
        ) : (
          <MessageCircle
            aria-hidden="true"
            className="block text-violet-200"
            size={19}
          />
        )}
        <span>{isOpen ? "Close" : "Ask the studio"}</span>
      </button>
    </div>
  );
}
