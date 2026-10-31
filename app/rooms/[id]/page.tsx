"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_ROOMS, toMillis } from "@/lib/helpers";
import Avatar from "@/components/Avatar";

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { user, userProfile, openAuth, toast } = useAuth();

  const [room, setRoom] = useState<any>(DEFAULT_ROOMS.find((r) => r.id === id) || null);
  const [roomChecked, setRoomChecked] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSent = useRef(0);

  // Room details once, messages by polling (swap for WebSocket/SSE later).
  useEffect(() => {
    if (!id) return;
    let stop = false;
    let lastId = "0";

    api(`/rooms/${id}`)
      .then(({ room }) => !stop && setRoom(room))
      .catch(() => !stop && setRoom(null))
      .finally(() => !stop && setRoomChecked(true));

    const poll = async (initial: boolean) => {
      try {
        const { messages: next } = await api(`/rooms/${id}/messages${lastId !== "0" ? `?after=${lastId}` : ""}`);
        if (stop || !next.length) return;
        lastId = next[next.length - 1].id;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...(initial ? [] : prev), ...next.filter((m: any) => initial || !seen.has(m.id))];
        });
      } catch (err) {
        console.error(err);
      } finally {
        if (!stop && initial) setLoading(false);
      }
    };
    poll(true);
    const timer = setInterval(() => poll(false), 3000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [id, user?.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !user || !userProfile || !room) return;
    if (Date.now() - lastSent.current < 1000) {
      toast("Slow down a little.", "info");
      return;
    }
    lastSent.current = Date.now();
    setSending(true);
    try {
      const { message } = await api(`/rooms/${id}/messages`, { json: { text: body } });
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      setText("");
    } catch (err) {
      console.error(err);
      toast(err instanceof Error ? err.message : "Message failed to send.", "error");
    } finally {
      setSending(false);
    }
  };

  if (roomChecked && !room) {
    return (
      <div className="px-4 py-24 text-center">
        <h1 className="text-2xl font-black mb-2">Room not found</h1>
        <p className="text-fog mb-6">It may never have existed. Or it vanished.</p>
        <Link href="/rooms" className="btn btn-acid">All rooms</Link>
      </div>
    );
  }

  return (
    <div className="w-full flex-grow flex flex-col px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/rooms" aria-label="Back to rooms" className="p-2 rounded-lg hover:bg-panel-2 text-fog hover:text-paper">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black truncate">{room?.name || "…"}</h1>
          <p className="mono text-[11px] text-fog truncate">
            {room?.topic} · {messages.length} message{messages.length === 1 ? "" : "s"} loaded
          </p>
        </div>
      </div>

      <div className="card flex-grow flex flex-col overflow-hidden min-h-[55vh] max-h-[70vh]">
        <div className="flex-grow overflow-y-auto p-4 space-y-4" aria-live="polite">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-acid" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-fog py-12">
              <p className="font-bold text-paper mb-1">It&apos;s quiet in here.</p>
              <p className="text-sm">Say something. Nobody knows who you are.</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = !!m.is_mine;
              return (
                <div key={m.id} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
                  <Avatar handle={m.author_handle} size={32} />
                  <div className={`max-w-[80%] ${mine ? "items-end text-right" : ""} flex flex-col`}>
                    <div className="mono text-[10px] text-fog mb-1">
                      {m.author_handle}
                      {m.created_at && (
                        <> · {new Date(toMillis(m.created_at)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
                      )}
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words text-left ${mine ? "bg-acid text-black rounded-tr-sm" : "bg-panel-2 rounded-tl-sm"}`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-line p-3">
          {user ? (
            <form onSubmit={send} className="flex gap-2">
              <label htmlFor="chat-input" className="sr-only">Message</label>
              <input
                id="chat-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={500}
                autoComplete="off"
                placeholder={`Message as ${userProfile?.anonymous_handle || "…"}`}
                className="field"
              />
              <button disabled={!text.trim() || sending} className="btn btn-acid px-4" aria-label="Send message">
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1 px-2">
              <span className="text-sm text-fog">Join to talk. You can read along for free.</span>
              <button onClick={() => openAuth("signup")} className="btn btn-acid">Join anonymously</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
