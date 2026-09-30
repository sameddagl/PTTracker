"use client";

import { Fragment, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useTransition } from "react";
import { SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message } from "@/db/messages";
import { formatDayMonth, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

// The chat used by both sides: the trainer's /mesajlar/[clientId] page and
// the client's portal. Sends optimistically, polls every few seconds while the
// tab is visible and marks the other side's messages read once they are on screen.

const MAX_LENGTH = 2000;
const POLL_MS = 10_000;

type Item = Message & { pending?: boolean };
export type SendMessageResult = { ok: true; message: Message } | { ok: false; error: string };

const dayKey = (d: Date, timeZone: string) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);

function dayLabel(d: Date, timeZone: string) {
  const key = dayKey(d, timeZone);
  const now = new Date();
  if (key === dayKey(now, timeZone)) return "Bugün";
  if (key === dayKey(new Date(now.getTime() - 86_400_000), timeZone)) return "Dün";
  return formatDayMonth(d, timeZone);
}

/** Server rows win over what we have; optimistic ones stay at the end until confirmed. */
function merge(prev: Item[], server: Message[]): Item[] {
  const byId = new Map(prev.filter((m) => !m.pending).map((m) => [m.id, m as Item]));
  for (const m of server) byId.set(m.id, m);
  const confirmed = [...byId.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return [...confirmed, ...prev.filter((m) => m.pending)];
}

export function ChatThread({
  initial,
  me,
  timeZone,
  send,
  poll,
  markRead,
  emptyText,
  placeholder = "Mesaj yaz",
  closed,
  className,
  draft = "",
}: {
  initial: Message[];
  me: Message["sender"];
  timeZone: string;
  send: (body: string) => Promise<SendMessageResult>;
  /** The thread's latest messages, or null when it can't be fetched right now. */
  poll: () => Promise<Message[] | null>;
  markRead: () => Promise<unknown>;
  emptyText: string;
  placeholder?: string;
  /** Shown instead of the composer when no new messages can be sent. */
  closed?: string;
  /** Height of the whole box; the message list scrolls inside it. */
  className?: string;
  /** Text already in the box, e.g. a ready-made message from a button on Bugün. */
  draft?: string;
}) {
  const [items, setItems] = useState<Item[]>(initial);
  const [text, setText] = useState(draft);
  const [pending, startTransition] = useTransition();
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const input = useRef<HTMLTextAreaElement>(null);

  // Keep the newest message in view, unless the reader scrolled up to read older ones.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [items]);

  const refresh = useEffectEvent(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const latest = await poll();
      if (latest) setItems((prev) => merge(prev, latest));
    } catch {
      // Offline or a deploy in between; the next tick tries again.
    }
  });

  useEffect(() => {
    const onVisibility = () => {
      const visible = document.visibilityState === "visible";
      setTabVisible(visible);
      if (visible) void refresh();
    };
    onVisibility();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const unreadIncoming = items.filter((m) => m.sender !== me && !m.readAt).length;
  const marking = useRef(false);
  const sendMarkRead = useEffectEvent(() => {
    if (marking.current) return;
    marking.current = true;
    markRead()
      .then(() => setItems((prev) => prev.map((m) => (m.sender !== me && !m.readAt ? { ...m, readAt: new Date() } : m))))
      .catch(() => {})
      .finally(() => {
        marking.current = false;
      });
  });
  useEffect(() => {
    if (unreadIncoming > 0 && inView && tabVisible) sendMarkRead();
  }, [unreadIncoming, inView, tabVisible]);

  function submit() {
    const body = text.trim();
    if (!body || pending) return;
    if ([...body].length > MAX_LENGTH) return void toast.error(`Mesaj en fazla ${MAX_LENGTH} karakter olabilir.`);
    const tempId = `pending-${Date.now()}`;
    atBottom.current = true;
    setItems((prev) => [...prev, { id: tempId, sender: me, body, createdAt: new Date(), readAt: null, pending: true }]);
    setText("");
    startTransition(async () => {
      let res: SendMessageResult;
      try {
        res = await send(body);
      } catch {
        res = { ok: false, error: "Mesaj gönderilemedi. Bağlantını kontrol edip tekrar dene." };
      }
      const result = res;
      setItems((prev) => {
        const rest = prev.filter((m) => m.id !== tempId);
        return result.ok ? merge(rest, [result.message]) : rest;
      });
      if (!result.ok) {
        // Give the text back so nothing typed is lost.
        setText((t) => t || body);
        toast.error(result.error);
      }
      input.current?.focus();
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    // Enter sends with a keyboard and mouse; on phones it stays a new line and the button sends.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    e.preventDefault();
    submit();
  }

  const lastSeenId = [...items].reverse().find((m) => m.sender === me && m.readAt && !m.pending)?.id;
  const length = [...text].length;

  return (
    <div className={cn("flex flex-col overflow-hidden surface", className)}>
      <div
        ref={scroller}
        role="log"
        aria-label="Mesajlar"
        tabIndex={0}
        onScroll={(e) => {
          const el = e.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset md:px-4"
      >
        {items.length === 0 ? (
          <p className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ol className="flex flex-col gap-1">
            {items.map((m, i) => {
              const prev = items[i - 1];
              const next = items[i + 1];
              const mine = m.sender === me;
              const newDay = !prev || dayKey(new Date(prev.createdAt), timeZone) !== dayKey(new Date(m.createdAt), timeZone);
              // Messages from one side within a few minutes read as one group, with the time under the last.
              const endsGroup =
                !next ||
                next.sender !== m.sender ||
                new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime() > 5 * 60_000 ||
                dayKey(new Date(next.createdAt), timeZone) !== dayKey(new Date(m.createdAt), timeZone);
              return (
                <Fragment key={m.id}>
                  {newDay && (
                    <li className="my-3 flex justify-center first:mt-0" aria-hidden>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        {dayLabel(new Date(m.createdAt), timeZone)}
                      </span>
                    </li>
                  )}
                  <li className={cn("flex flex-col", mine ? "items-end" : "items-start", endsGroup && "mb-2")}>
                    <p
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2 text-base break-words whitespace-pre-wrap md:max-w-[75%] md:text-sm",
                        mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                        endsGroup && (mine ? "rounded-br-md" : "rounded-bl-md"),
                        m.pending && "opacity-70",
                      )}
                    >
                      <span className="sr-only">{mine ? "Sen: " : "Karşı taraf: "}</span>
                      {m.body}
                    </p>
                    {endsGroup && (
                      <span className="mt-1 px-1 text-xs text-muted-foreground tabular-nums">
                        {m.pending ? "Gönderiliyor…" : formatTime(new Date(m.createdAt), timeZone)}
                        {m.id === lastSeenId && " · Görüldü"}
                      </span>
                    )}
                  </li>
                </Fragment>
              );
            })}
          </ol>
        )}
      </div>
      {closed ? (
        <p className="border-t px-4 py-3 text-center text-sm text-muted-foreground">{closed}</p>
      ) : (
        <form
          className="flex items-end gap-2 border-t p-2 md:p-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="sr-only" htmlFor="chat-input">
            Mesaj
          </label>
          <div className="relative min-w-0 flex-1">
            <Textarea
              ref={input}
              id="chat-input"
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => {
                // The keyboard opening shrinks the viewport; keep the latest message visible.
                atBottom.current = true;
              }}
              placeholder={placeholder}
              enterKeyHint="enter"
              aria-describedby={length > MAX_LENGTH - 200 ? "chat-count" : undefined}
              aria-invalid={length > MAX_LENGTH || undefined}
              className="max-h-40 min-h-11 resize-none rounded-3xl py-2.5 md:min-h-10"
            />
            {length > MAX_LENGTH - 200 && (
              <span
                id="chat-count"
                className={cn("absolute -top-6 right-2 text-xs tabular-nums", length > MAX_LENGTH ? "text-destructive-strong" : "text-muted-foreground")}
              >
                {length}/{MAX_LENGTH}
              </span>
            )}
          </div>
          <Button type="submit" size="icon" loading={pending} disabled={!text.trim() || length > MAX_LENGTH} aria-label="Gönder">
            <SendHorizontal />
          </Button>
        </form>
      )}
    </div>
  );
}
