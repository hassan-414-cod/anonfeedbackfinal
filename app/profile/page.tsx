"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "@/lib/local-db";
import { Loader2, RefreshCw, ArrowBigUp, ArrowBigDown, Trash2, Star } from "lucide-react";
import { db } from "@/lib/local-db";
import { useAuth } from "@/lib/auth-context";
import { generateHandle, timeAgo, toMillis } from "@/lib/helpers";
import Avatar from "@/components/Avatar";
import Gate from "@/components/Gate";

export default function ProfilePage() {
  const { user, userProfile, loading: authLoading, refreshProfile, toast } = useAuth();

  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [myFeedbacks, setMyFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectSort, setProjectSort] = useState("newest");
  const [editingPermissionId, setEditingPermissionId] = useState<string | null>(null);
  const [burning, setBurning] = useState(false);

  const fetchMine = useCallback(async () => {
    if (!user) return;
    try {
      const pSnap = await getDocs(
        query(collection(db, "projects"), where("owner_user_id", "==", user.uid)),
      );
      setMyProjects(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const fSnap = await getDocs(
        query(collection(db, "feedback"), where("reviewer_user_id", "==", user.uid)),
      );
      setMyFeedbacks(
        fSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as any)
          .sort((a, b) => toMillis(b.created_at) - toMillis(a.created_at)),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  const updatePermission = async (projectId: string, newPermission: string) => {
    try {
      await updateDoc(doc(db, "projects", projectId), { download_permission: newPermission });
      setMyProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, download_permission: newPermission } : p)),
      );
      setEditingPermissionId(null);
      toast("Permission updated.", "success");
    } catch (err) {
      console.error(err);
      toast("Failed to update permission.", "error");
    }
  };

  const deleteProject = async (p: any) => {
    if (!window.confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    try {
      await deleteDoc(doc(db, "projects", p.id));
      setMyProjects((prev) => prev.filter((x) => x.id !== p.id));
      toast("Project deleted.", "success");
    } catch (err) {
      console.error(err);
      toast("Couldn't delete that project.", "error");
    }
  };

  const burnIdentity = async () => {
    if (!user) return;
    if (
      !window.confirm(
        "Burn this identity and get a new random handle? Your old posts and reviews keep the old handle. Scores stay with your account.",
      )
    )
      return;
    setBurning(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { anonymous_handle: generateHandle() });
      await refreshProfile();
      toast("New identity assigned.", "success");
    } catch (err) {
      console.error(err);
      toast("Couldn't change your handle.", "error");
    } finally {
      setBurning(false);
    }
  };

  if (!user) {
    return <Gate message="Log in to see your anonymous profile." />;
  }
  if (authLoading || !userProfile) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-acid" />
      </div>
    );
  }

  const sortedProjects = [...myProjects].sort((a, b) => {
    if (projectSort === "most_feedback") return (b.feedback_count || 0) - (a.feedback_count || 0);
    if (projectSort === "most_upvoted") return (b.upvotes || 0) - (a.upvotes || 0);
    return toMillis(b.created_at) - toMillis(a.created_at);
  });

  const isPro = userProfile.subscription_status === "active";

  return (
    <div className="w-full flex-grow flex flex-col px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="card p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-ghost/25 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-5 min-w-0">
          <Avatar handle={userProfile.anonymous_handle} size={88} square />
          <div className="min-w-0">
            <div className="mono text-[10px] uppercase tracking-widest text-fog mb-1">Current identity</div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight break-all">
              {userProfile.anonymous_handle}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`chip ${isPro ? "text-acid border-acid/50" : ""}`}>
                plan: {isPro ? "pro" : "free"}
              </span>
              <Link href="/billing" className="chip hover:text-paper hover:border-fog">
                manage billing
              </Link>
              <button onClick={burnIdentity} disabled={burning} className="chip hover:text-alert hover:border-alert/50">
                <RefreshCw className={`w-3 h-3 ${burning ? "animate-spin" : ""}`} /> burn identity
              </button>
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-2 bg-ink/60 border border-line rounded-2xl divide-x divide-line shrink-0">
          <div className="text-center p-4 sm:px-8">
            <div className="mono text-[10px] uppercase tracking-widest text-fog mb-1">Builder score</div>
            <div className="text-4xl font-black text-acid">{userProfile.builder_score || 0}</div>
          </div>
          <div className="text-center p-4 sm:px-8">
            <div className="mono text-[10px] uppercase tracking-widest text-fog mb-1">Helpful score</div>
            <div className="text-4xl font-black text-violet-300">{userProfile.reviewer_score || 0}</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-acid" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* uploads */}
          <div className="card flex flex-col overflow-hidden">
            <div className="border-b border-line px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="font-black">My uploads</h2>
                <span className="chip">{myProjects.length}</span>
              </div>
              <select
                aria-label="Sort projects"
                value={projectSort}
                onChange={(e) => setProjectSort(e.target.value)}
                className="field py-1.5 px-3 text-xs w-auto"
              >
                <option value="newest">Newest</option>
                <option value="most_feedback">Most feedback</option>
                <option value="most_upvoted">Most upvoted</option>
              </select>
            </div>
            <div className="overflow-y-auto max-h-[700px]">
              {sortedProjects.length === 0 ? (
                <div className="p-8 text-center text-fog">
                  You haven&apos;t uploaded any projects yet.{" "}
                  <Link href="/projects?tab=new" className="text-acid font-bold hover:underline">
                    Upload one now.
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {sortedProjects.map((proj) => (
                    <li key={proj.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <Link href={`/project/${proj.id}`} className="group min-w-0">
                          <h3 className="text-lg font-bold group-hover:text-acid truncate">{proj.title}</h3>
                          <div className="mono text-[10px] uppercase tracking-wider text-fog mt-1 flex flex-wrap gap-x-3">
                            <span>{timeAgo(proj.created_at)}</span>
                            <span>{proj.feedback_count || 0} feedback</span>
                            <span>▲ {proj.upvotes || 0}</span>
                          </div>
                        </Link>
                        <button
                          onClick={() => deleteProject(proj)}
                          aria-label={`Delete ${proj.title}`}
                          className="text-fog hover:text-alert p-1 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {proj.file_url && (
                        <div className="mt-3 flex items-center justify-between gap-3 p-3 bg-ink/60 border border-dashed border-line rounded-xl">
                          <span className="mono text-[10px] uppercase tracking-widest text-fog">file access</span>
                          {editingPermissionId === proj.id ? (
                            <select
                              autoFocus
                              className="field py-1 px-2 text-xs w-auto"
                              defaultValue={proj.download_permission || "view_only"}
                              onChange={(e) => updatePermission(proj.id, e.target.value)}
                              onBlur={() => setEditingPermissionId(null)}
                            >
                              <option value="download_allowed">Download allowed</option>
                              <option value="view_only">View only</option>
                              <option value="off">Off</option>
                            </select>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold">
                                {proj.download_permission === "off"
                                  ? "Off"
                                  : proj.download_permission === "download_allowed"
                                    ? "Download allowed"
                                    : "View only"}
                              </span>
                              <button
                                onClick={() => setEditingPermissionId(proj.id)}
                                className="mono text-[10px] uppercase tracking-widest text-acid hover:underline"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* reviews */}
          <div className="card flex flex-col overflow-hidden">
            <div className="border-b border-line px-5 py-4 flex items-center justify-between">
              <h2 className="font-black">Reviews given</h2>
              <span className="chip">{myFeedbacks.length}</span>
            </div>
            <div className="overflow-y-auto max-h-[700px]">
              {myFeedbacks.length === 0 ? (
                <div className="p-8 text-center text-fog">
                  You haven&apos;t reviewed any projects yet.{" "}
                  <Link href="/feed" className="text-acid font-bold hover:underline">
                    Browse the feed.
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {myFeedbacks.map((fb) => (
                    <li key={fb.id} className="p-5">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${fb.vote === "up" ? "bg-acid/15 text-acid" : "bg-alert/15 text-alert"}`}>
                            {fb.vote === "up" ? <ArrowBigUp className="w-5 h-5" /> : <ArrowBigDown className="w-5 h-5" />}
                          </div>
                          <span className="mono text-[11px] text-fog">{timeAgo(fb.created_at)}</span>
                        </div>
                        <Link href={`/project/${fb.project_id}`} className="text-xs font-bold text-acid hover:underline">
                          Go to project →
                        </Link>
                      </div>
                      {fb.has_text ? (
                        <p className="text-sm text-paper/90 line-clamp-3">
                          &quot;{fb.whats_good || fb.whats_improvable || fb.suggested_next_step}&quot;
                        </p>
                      ) : (
                        <p className="mono text-xs text-fog">voted without text feedback</p>
                      )}
                      {fb.marked_helpful && (
                        <span className="mt-3 mono text-[10px] uppercase tracking-widest bg-acid text-black px-2 py-1 rounded inline-flex items-center gap-1 font-bold">
                          <Star className="w-3 h-3" /> Marked helpful
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
