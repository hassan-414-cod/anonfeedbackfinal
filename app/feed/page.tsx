"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, orderBy, query } from "@/lib/local-db";
import { Search, Loader2, EyeOff, X } from "lucide-react";
import { db } from "@/lib/local-db";
import { CATEGORIES, toMillis } from "@/lib/helpers";
import ProjectCard from "@/components/ProjectCard";

export default function FeedPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "upvoted">("newest");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const snap = await getDocs(
        query(collection(db, "projects"), orderBy("created_at", "desc"), limit(100)),
      );
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = projects.filter((p) => {
      const okCat = activeCategory === "All" || p.category === activeCategory;
      const okSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.owner_handle?.toLowerCase().includes(q);
      return okCat && okSearch;
    });
    list.sort((a, b) =>
      sortBy === "upvoted"
        ? (b.upvotes || 0) - (a.upvotes || 0) || toMillis(b.created_at) - toMillis(a.created_at)
        : toMillis(b.created_at) - toMillis(a.created_at),
    );
    return list;
  }, [projects, activeCategory, searchQuery, sortBy]);

  return (
    <div className="w-full flex-grow flex flex-col px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <div className="chip mb-3"><span className="live-dot" /> live feed</div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">The Feed</h1>
          <p className="text-fog mt-1">Projects from anonymous builders, waiting for your take.</p>
        </div>
        <div className="flex items-center bg-panel rounded-full p-1 border border-line self-start sm:self-auto">
          {(["newest", "upvoted"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              aria-pressed={sortBy === s}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
                sortBy === s ? "bg-acid text-black" : "text-fog hover:text-paper"
              }`}
            >
              {s === "newest" ? "Newest" : "Popular"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fog h-5 w-5" />
          <input
            type="search"
            aria-label="Search projects"
            placeholder="Search projects, categories, handles…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field !pl-12 !pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fog hover:text-paper"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
              className={`whitespace-nowrap px-4 py-2 rounded-lg mono text-[11px] uppercase tracking-wider border transition-colors ${
                activeCategory === cat
                  ? "bg-acid border-acid text-black font-bold"
                  : "bg-panel border-line text-fog hover:text-paper hover:border-fog"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-acid" />
        </div>
      ) : failed ? (
        <div className="card border-dashed py-16 text-center px-6">
          <p className="font-bold mb-2">Couldn&apos;t load the feed.</p>
          <p className="text-fog text-sm mb-5">Check your connection and try again.</p>
          <button onClick={load} className="btn btn-acid">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card border-dashed py-16 text-center px-6">
          <EyeOff className="w-9 h-9 text-fog mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-1">
            {projects.length === 0 ? "The feed is empty" : "No projects match"}
          </h3>
          <p className="text-fog text-sm mb-5">
            {projects.length === 0
              ? "Nobody has posted yet. Be the first."
              : "Try adjusting your filters or search."}
          </p>
          {projects.length === 0 ? (
            <Link href="/projects?tab=new" className="btn btn-acid">Upload a project</Link>
          ) : (
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All");
              }}
              className="btn btn-ghost"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-8">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
