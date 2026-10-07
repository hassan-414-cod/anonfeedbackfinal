"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import {
  Upload,
  MessageSquare,
  PlusCircle,
  Link as LinkIcon,
  ArrowRight,
  Share2,
  EyeOff,
  Flame,
  Trophy,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { ROOM_TOPICS } from "@/lib/helpers";
import ProjectCard from "@/components/ProjectCard";

export default function HomePage() {
  const { user, userProfile, toast, openAuth } = useAuth();
  const [stats, setStats] = useState<{ users: number; projects: number; feedback: number } | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [roomTopic, setRoomTopic] = useState(ROOM_TOPICS[0]);

  useEffect(() => {
    (async () => {
      try {
        const [u, p, f] = await Promise.all([
          getCountFromServer(collection(db, "users")),
          getCountFromServer(collection(db, "projects")),
          getCountFromServer(collection(db, "feedback")),
        ]);
        setStats({
          users: u.data().count,
          projects: p.data().count,
          feedback: f.data().count,
        });
      } catch (e) {
        console.error(e);
      }
      try {
        const snap = await getDocs(
          query(collection(db, "projects"), orderBy("created_at", "desc"), limit(3)),
        );
        setRecent(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const invite = async () => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const text = "Get honest anonymous feedback on your project. No names, no clout.";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Anon-Feedback", text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("Invite link copied. Send it to a friend.", "success");
    } catch {
      // user dismissed share sheet or clipboard blocked
      toast(`Share this link: ${url}`, "info");
    }
  };

  const steps = [
    { n: "01", title: "Get a mask", text: "Sign up and receive a random handle. Your email is never shown." },
    { n: "02", title: "Drop your work", text: "Links, designs, docs, code or video. You control who can download." },
    { n: "03", title: "Take the truth", text: "Strangers vote and critique. Mark the useful ones to boost their rep." },
  ];

  return (
    <div className="w-full flex-grow flex flex-col px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      {/* HERO */}
      <section className="card relative overflow-hidden p-6 sm:p-12 lg:p-16 mb-12">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-paper) 1px, transparent 1px), linear-gradient(90deg, var(--color-paper) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-ghost/30 blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl">
          <div className="chip mb-6">
            <span className="live-dot" />
            {userProfile ? `signed in as ${userProfile.anonymous_handle}` : "nobody here knows who you are"}
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.02] tracking-tight mb-6">
            <span className="glitch" data-text="Say it straight.">Say it straight.</span>
            <br />
            <span className="text-acid">Sign nothing.</span>
          </h1>
          <p className="text-fog text-base sm:text-xl max-w-xl mb-8 leading-relaxed">
            Upload your project, get the brutal truth from strangers, and hang
            out in anonymous rooms. No followers. No clout. Just{" "}
            <span className="redacted px-1">useful critique</span>.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/projects?tab=new" className="btn btn-acid h-12 px-6">
              Upload now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/feed" className="btn btn-ghost h-12 px-6">
              Browse the feed
            </Link>
            <button onClick={invite} className="btn btn-ghost h-12 px-6">
              <Share2 className="w-4 h-4" /> Invite a friend
            </button>
          </div>
        </div>

        {/* real stats */}
        <div className="relative mt-10 grid grid-cols-3 gap-3 max-w-xl">
          {[
            { label: "Masks", value: stats?.users },
            { label: "Projects", value: stats?.projects },
            { label: "Critiques", value: stats?.feedback },
          ].map((s) => (
            <div key={s.label} className="bg-ink/60 border border-line rounded-xl p-3 sm:p-4">
              <div className="text-2xl sm:text-3xl font-black text-acid mono">
                {s.value === undefined ? "—" : s.value.toLocaleString()}
              </div>
              <div className="mono text-[10px] uppercase tracking-widest text-fog">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mb-14">
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="card p-6">
              <div className="mono text-acid text-sm mb-3">{s.n}</div>
              <h3 className="text-xl font-bold mb-1">{s.title}</h3>
              <p className="text-fog text-sm">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ACTIONS */}
      <h2 className="text-2xl font-black tracking-tight mb-5">What do you want to do?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        <Link href="/projects?tab=new" className="group card p-6 flex flex-col hover:border-acid/60 transition-colors">
          <Upload className="w-7 h-7 text-acid mb-5 group-hover:-translate-y-1 transition-transform" />
          <h3 className="text-lg font-bold mb-1">Upload a project</h3>
          <p className="text-sm text-fog flex-grow mb-4">
            Docs, designs, code or video. Get structured critique.
          </p>
          <span className="mono text-xs text-acid flex items-center gap-1">
            start <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
        <Link href="/projects?tab=new&type=link" className="group card p-6 flex flex-col hover:border-acid/60 transition-colors">
          <LinkIcon className="w-7 h-7 text-ghost mb-5 group-hover:-translate-y-1 transition-transform" />
          <h3 className="text-lg font-bold mb-1">Drop a link</h3>
          <p className="text-sm text-fog flex-grow mb-4">
            Have a live site? Paste the URL and get instant eyes on it.
          </p>
          <span className="mono text-xs text-ghost flex items-center gap-1">
            share url <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
        <Link href="/rooms" className="group card p-6 flex flex-col hover:border-acid/60 transition-colors">
          <MessageSquare className="w-7 h-7 text-sky-300 mb-5 group-hover:-translate-y-1 transition-transform" />
          <h3 className="text-lg font-bold mb-1">Enter a chat room</h3>
          <p className="text-sm text-fog flex-grow mb-4">
            Live anonymous rooms about design, code and ideas.
          </p>
          <span className="mono text-xs text-sky-300 flex items-center gap-1">
            join <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
        <div className="card p-6 flex flex-col">
          <PlusCircle className="w-7 h-7 text-amber-300 mb-5" />
          <h3 className="text-lg font-bold mb-1">Create a room</h3>
          <p className="text-sm text-fog mb-3">Start your own anonymous room.</p>
          <label className="sr-only" htmlFor="home-room-topic">Room topic</label>
          <select
            id="home-room-topic"
            value={roomTopic}
            onChange={(e) => setRoomTopic(e.target.value)}
            className="field mb-3 py-2 text-sm"
          >
            {ROOM_TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <Link
            href={`/rooms?new=1&topic=${encodeURIComponent(roomTopic)}`}
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                openAuth("signup");
              }
            }}
            className="btn btn-ghost mt-auto"
          >
            Create room
          </Link>
        </div>
      </div>

      {/* RECENT */}
      <section className="mb-6">
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-alert" /> Fresh off the press
          </h2>
          <Link href="/feed" className="text-sm font-bold text-acid hover:underline">
            See all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="card border-dashed py-14 px-6 text-center">
            <EyeOff className="w-9 h-9 text-fog mx-auto mb-3" />
            <p className="font-bold mb-1">Nothing here yet.</p>
            <p className="text-fog text-sm mb-5">Be the first anonymous soul to post something.</p>
            <Link href="/projects?tab=new" className="btn btn-acid">Upload the first project</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recent.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      <section className="card p-6 sm:p-8 mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Trophy className="w-9 h-9 text-acid shrink-0" />
          <div>
            <h3 className="font-bold text-lg">Earn rep, not followers</h3>
            <p className="text-fog text-sm">
              Builders climb by getting upvotes. Reviewers climb by being helpful.
            </p>
          </div>
        </div>
        <Link href="/leaderboard" className="btn btn-ghost">View leaderboard</Link>
      </section>
    </div>
  );
}
