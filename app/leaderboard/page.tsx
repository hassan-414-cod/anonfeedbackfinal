"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { Trophy, RefreshCw, EyeOff } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Avatar from "@/components/Avatar";

type Tab = "builders" | "reviewers";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("builders");
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(
    async (force = false) => {
      setLoading(true);
      const field = activeTab === "builders" ? "builder_score" : "reviewer_score";
      const cacheKey = `leaderboard_${activeTab}`;

      if (!force) {
        try {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            const { timestamp, data } = JSON.parse(cached);
            if (Date.now() - timestamp < 5 * 60 * 1000) {
              setTopUsers(data);
              setLoading(false);
              return;
            }
          }
        } catch {
          /* storage unavailable */
        }
      }

      try {
        const snap = await getDocs(
          query(collection(db, "users"), orderBy(field, "desc"), limit(20)),
        );
        const list = snap.docs
          .map((d) => {
            const { anonymous_handle, builder_score, reviewer_score } = d.data();
            return { id: d.id, anonymous_handle, builder_score, reviewer_score };
          })
          .filter((u: any) => u[field] > 0);
        setTopUsers(list);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: list }));
        } catch {
          /* ignore */
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [activeTab],
  );

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const field = activeTab === "builders" ? "builder_score" : "reviewer_score";
  const medal = ["bg-acid text-black", "bg-zinc-300 text-black", "bg-orange-400 text-black"];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-grow">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <div className="chip mb-3"><Trophy className="w-3 h-3" /> rep, not followers</div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Leaderboard</h1>
          <p className="text-fog mt-1">Top anonymous contributors shaping the community.</p>
        </div>
        <button onClick={() => fetchLeaderboard(true)} className="btn btn-ghost" aria-label="Refresh leaderboard">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-2 border-b border-line">
          {(["builders", "reviewers"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              aria-pressed={activeTab === t}
              className={`py-4 mono text-xs uppercase tracking-widest transition-colors ${
                activeTab === t ? "bg-acid text-black font-bold" : "text-fog hover:text-paper hover:bg-panel-2"
              }`}
            >
              Top {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-16 flex justify-center text-acid">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        ) : topUsers.length === 0 ? (
          <div className="p-12 text-center">
            <EyeOff className="w-9 h-9 text-fog mx-auto mb-3" />
            <p className="font-bold mb-1">Nobody on the board yet.</p>
            <p className="text-fog text-sm mb-5">
              {activeTab === "builders"
                ? "Upload a project and earn upvotes to appear here."
                : "Leave helpful feedback and get it marked helpful to appear here."}
            </p>
            <Link href={activeTab === "builders" ? "/projects?tab=new" : "/feed"} className="btn btn-acid">
              {activeTab === "builders" ? "Upload a project" : "Review something"}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {topUsers.map((u, i) => (
              <li
                key={u.id}
                className={`p-4 sm:px-6 flex items-center justify-between gap-3 ${user?.uid === u.id ? "bg-acid/5" : ""}`}
              >
                <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mono font-black shrink-0 ${medal[i] || "bg-panel-2 text-fog"}`}>
                    {i + 1}
                  </div>
                  <Avatar handle={u.anonymous_handle} size={36} />
                  <div className="mono font-bold truncate">
                    {u.anonymous_handle}
                    {user?.uid === u.id && <span className="text-acid ml-2 text-xs">(you)</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="mono text-[9px] uppercase tracking-widest text-fog">score</div>
                  <div className="text-2xl font-black text-acid">{u[field]}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
