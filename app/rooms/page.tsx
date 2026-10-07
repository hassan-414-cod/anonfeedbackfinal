"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, doc, getDocs, serverTimestamp, setDoc } from "@/lib/local-db";
import { ArrowRight, Loader2, MessageSquare, PlusCircle, X } from "lucide-react";
import { db } from "@/lib/local-db";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_ROOMS, ROOM_TOPICS, timeAgo, toMillis } from "@/lib/helpers";

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "room"
  );
}

function RoomsContent() {
  const { user, userProfile, openAuth, toast } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rooms, setRooms] = useState<any[]>(DEFAULT_ROOMS);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState(ROOM_TOPICS[0]);
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "rooms"));
      const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      const byId = new Map(remote.map((r) => [r.id, r]));
      const merged = [
        ...DEFAULT_ROOMS.map((r) => ({ ...r, ...(byId.get(r.id) || {}) })),
        ...remote.filter((r) => !DEFAULT_ROOMS.some((d) => d.id === r.id)),
      ];
      merged.sort((a, b) => {
        const aDef = DEFAULT_ROOMS.some((d) => d.id === a.id) ? 1 : 0;
        const bDef = DEFAULT_ROOMS.some((d) => d.id === b.id) ? 1 : 0;
        if (aDef !== bDef) return bDef - aDef;
        return toMillis(b.last_message_at || b.created_at) - toMillis(a.last_message_at || a.created_at);
      });
      setRooms(merged);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ?new=1&topic=... from the home page
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      const t = searchParams.get("topic");
      if (t && ROOM_TOPICS.includes(t)) setTopic(t);
      if (user) setShowCreate(true);
      else openAuth("signup");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  const openCreate = () => {
    if (!user) {
      openAuth("signup");
      return;
    }
    setShowCreate(true);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;
    setCreating(true);
    try {
      const id = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;
      await setDoc(doc(db, "rooms", id), {
        name: name.trim(),
        topic,
        description: description.trim(),
        created_by_uid: user.uid,
        created_by_handle: userProfile.anonymous_handle,
        message_count: 0,
        created_at: serverTimestamp(),
      });
      toast("Room created.", "success");
      router.push(`/rooms/${id}`);
    } catch (err) {
      console.error(err);
      toast("Couldn't create the room. Try again.", "error");
      setCreating(false);
    }
  };

  return (
    <div className="w-full flex-grow px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="chip mb-3"><span className="live-dot" /> live rooms</div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Anonymous chat rooms</h1>
          <p className="text-fog mt-1">Talk shop with other masks. Nothing here is tied to your real identity.</p>
        </div>
        <button onClick={openCreate} className="btn btn-acid self-start sm:self-auto">
          <PlusCircle className="w-4 h-4" /> Create room
        </button>
      </div>

      {loading && (
        <div className="py-4 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-acid" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((r) => (
          <Link
            key={r.id}
            href={`/rooms/${r.id}`}
            className="group card p-5 flex items-center justify-between gap-4 hover:border-acid/60 transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-panel-2 flex items-center justify-center text-fog group-hover:bg-acid group-hover:text-black transition-colors shrink-0">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold truncate">{r.name}</h3>
                <p className="text-xs text-fog truncate">{r.description || r.topic}</p>
                <p className="mono text-[10px] text-fog mt-1">
                  {r.message_count || 0} messages
                  {r.last_message_at ? ` · last ${timeAgo(r.last_message_at)}` : ""}
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full border border-line flex items-center justify-center group-hover:bg-acid group-hover:text-black group-hover:border-acid transition-colors shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          onMouseDown={(e) => e.target === e.currentTarget && setShowCreate(false)}
          role="dialog"
          aria-modal="true"
        >
          <form onSubmit={create} className="card w-full max-w-md p-6 sm:p-8 fade-up relative rounded-b-none sm:rounded-b-[1.25rem]">
            <button type="button" onClick={() => setShowCreate(false)} aria-label="Close" className="absolute right-4 top-4 text-fog hover:text-paper">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black mb-5">Create a room</h2>
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="room-name">Room name</label>
                <input id="room-name" required minLength={3} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="e.g. Landing page roast" />
              </div>
              <div>
                <label className="label" htmlFor="room-topic">Topic</label>
                <select id="room-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="field">
                  {ROOM_TOPICS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="room-desc">Description (optional)</label>
                <input id="room-desc" maxLength={100} value={description} onChange={(e) => setDescription(e.target.value)} className="field" placeholder="What's this room for?" />
              </div>
            </div>
            <button disabled={creating} className="btn btn-acid w-full h-12 mt-6">
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create & enter"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-fog mono text-sm">loading<span className="blink">_</span></div>}>
      <RoomsContent />
    </Suspense>
  );
}
