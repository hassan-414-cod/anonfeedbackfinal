"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trophy, Star, RefreshCw } from "lucide-react";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"builders" | "reviewers">(
    "builders",
  );
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const field = activeTab === "builders" ? "builder_score" : "reviewer_score";
    const cacheKey = `leaderboard_${activeTab}`;

    // Check cache
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      const { timestamp, data } = JSON.parse(cachedData);
      // 5 minutes cache
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        setTopUsers(data);
        setLoading(false);
        return;
      }
    }

    try {
      const q = query(
        collection(db, "users"),
        orderBy(field, "desc"),
        limit(20),
      );
      const snapshot = await getDocs(q);
      const lists = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u) => u[field] > 0);
      setTopUsers(lists);

      // Update cache
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          timestamp: Date.now(),
          data: lists,
        }),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeaderboard();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 flex-grow">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter mb-2 text-[#1A1A1A]">
            Leaderboard
          </h1>
          <p className="text-gray-500 font-bold italic">
            Top anonymous contributors shaping the community.
          </p>
        </div>
      </div>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <div className="flex border-b-4 border-black">
          <button
            onClick={() => setActiveTab("builders")}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "builders" ? "bg-black text-white hover:bg-gray-900" : "bg-white text-black hover:bg-gray-100"}`}
          >
            Top Builders
          </button>
          <button
            onClick={() => setActiveTab("reviewers")}
            className={`flex-1 py-4 border-l-4 border-black text-xs font-black uppercase tracking-widest transition-all ${activeTab === "reviewers" ? "bg-black text-white hover:bg-gray-900" : "bg-white text-black hover:bg-gray-100"}`}
          >
            Top Reviewers
          </button>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-16 flex justify-center text-black">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : topUsers.length === 0 ? (
            <div className="p-16 text-center text-xl font-black uppercase italic text-gray-500">
              No users found.
            </div>
          ) : (
            <ul className="divide-y-4 divide-black">
              {topUsers.map((u, i) => (
                <li
                  key={u.id}
                  className="p-4 sm:px-8 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-12 h-12 flex items-center justify-center font-black text-xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] ${i === 0 ? "bg-[#FFE66D]" : i === 1 ? "bg-gray-300" : i === 2 ? "bg-orange-300" : "bg-white"}`}
                    >
                      #{i + 1}
                    </div>
                    <div>
                      <div className="font-mono font-bold text-lg">
                        {u.anonymous_handle}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center px-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      SCORE
                    </span>
                    <span className="font-black text-2xl">
                      {activeTab === "builders"
                        ? u.builder_score
                        : u.reviewer_score}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
