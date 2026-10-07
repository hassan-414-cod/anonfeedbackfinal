"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function ProfilePage() {
  const { user, userProfile } = useAuth();

  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [myFeedbacks, setMyFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [projectSort, setProjectSort] = useState("newest"); // newest, most_feedback, most_upvoted
  const [editingPermissionId, setEditingPermissionId] = useState<string | null>(
    null,
  );

  const fetchMine = async () => {
    if (!user) return;
    try {
      const pQ = query(
        collection(db, "projects"),
        where("owner_user_id", "==", user.uid),
      );
      const pSnap = await getDocs(pQ);
      let projects = pSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Fetch feedback counts
      for (let p of projects) {
        const fbQ = query(
          collection(db, "feedback"),
          where("project_id", "==", p.id),
        );
        const fbSnap = await getDocs(fbQ);
        p.feedback_count = fbSnap.size;
      }

      setMyProjects(projects);

      const fQ = query(
        collection(db, "feedback"),
        where("reviewer_user_id", "==", user.uid),
      );
      const fSnap = await getDocs(fQ);
      setMyFeedbacks(
        fSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => b.created_at - a.created_at),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMine();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updatePermission = async (projectId: string, newPermission: string) => {
    try {
      await updateDoc(doc(db, "projects", projectId), {
        download_permission: newPermission,
      });
      setMyProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, download_permission: newPermission } : p,
        ),
      );
      setEditingPermissionId(null);
    } catch (err) {
      console.error("Failed to update permission", err);
    }
  };

  if (!user || (!loading && !userProfile)) {
    return (
      <div className="p-12 text-center text-xl font-black uppercase italic text-gray-500">
        Please log in to view your profile.
      </div>
    );
  }

  const sortedProjects = [...myProjects].sort((a, b) => {
    if (projectSort === "newest") {
      return (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0);
    } else if (projectSort === "most_feedback") {
      return (b.feedback_count || 0) - (a.feedback_count || 0);
    } else if (projectSort === "most_upvoted") {
      return (b.upvotes || 0) - (a.upvotes || 0);
    }
    return 0;
  });

  return (
    <div className="w-full flex-grow flex flex-col p-6 sm:p-8 space-y-12">
      {/* Profile Header */}
      <div className="bg-[#FFE66D] border-4 border-black p-8 sm:p-12 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center text-5xl font-black uppercase italic">
            {userProfile?.anonymous_handle?.[0]}
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] mb-2">
              Current Identity
            </div>
            <h1 className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter text-[#1A1A1A] leading-none">
              {userProfile?.anonymous_handle}
            </h1>

            {/* Subscription and Upload Limits Info */}
            <div className="mt-4 flex gap-4">
              <span className="text-xs font-bold bg-white border-2 border-black px-2 py-1 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                Plan:{" "}
                {userProfile?.subscription_status === "active" ? "PRO" : "FREE"}
              </span>
              <Link
                href="/billing"
                className="text-xs font-bold bg-white border-2 border-black px-2 py-1 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                Manage Billing
              </Link>
            </div>
          </div>
        </div>

        <div className="flex bg-white border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="text-center p-4 sm:px-8 border-r-4 border-black">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
              Builder Score
            </div>
            <div className="text-4xl font-black">
              {userProfile?.builder_score || 0}
            </div>
          </div>
          <div className="text-center p-4 sm:px-8">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">
              Helpful Score
            </div>
            <div className="text-4xl font-black">
              {userProfile?.reviewer_score || 0}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-black" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* My Projects */}
          <div className="bg-white border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col">
            <div className="bg-[#f0f0f0] border-b-4 border-black px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-black uppercase tracking-tighter">
                  My Uploads
                </h2>
                <span className="font-mono font-bold text-xs bg-white border border-black px-2 py-0.5">
                  {myProjects.length}
                </span>
              </div>
              <select
                value={projectSort}
                onChange={(e) => setProjectSort(e.target.value)}
                className="text-xs font-bold border-2 border-black outline-none px-2 py-1 cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="most_feedback">Most Feedback</option>
                <option value="most_upvoted">Most Upvoted</option>
              </select>
            </div>
            <div className="p-0 overflow-y-auto max-h-[800px]">
              {sortedProjects.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-bold italic">
                  You haven&apos;t uploaded any projects yet.{" "}
                  <Link
                    href="/upload"
                    className="text-indigo-600 hover:underline"
                  >
                    Upload one now.
                  </Link>
                </div>
              ) : (
                <ul className="divide-y-2 divide-black">
                  {sortedProjects.map((proj) => (
                    <li
                      key={proj.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <Link
                        href={`/project/${proj.id}`}
                        className="block mb-4 group"
                      >
                        <h3 className="text-xl font-bold leading-tight mb-2 group-hover:underline">
                          {proj.title}
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          <span>
                            {proj.created_at?.toDate
                              ? formatDistanceToNow(proj.created_at.toDate())
                              : "Recently"}{" "}
                            ago
                          </span>
                          {proj.file_type && (
                            <span className="border border-gray-300 px-1 py-0.5">
                              {proj.file_type}
                            </span>
                          )}
                          <span>{proj.feedback_count || 0} Feedback</span>
                        </div>
                      </Link>

                      <div className="flex flex-col gap-3 p-4 bg-gray-100 border-2 border-black border-dashed">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-widest">
                            Permission:
                          </span>
                          {editingPermissionId === proj.id ? (
                            <select
                              className="text-xs font-bold border-2 border-black px-2 py-1 outline-none"
                              defaultValue={
                                proj.download_permission || "download_allowed"
                              }
                              onChange={(e) =>
                                updatePermission(proj.id, e.target.value)
                              }
                            >
                              <option value="download_allowed">
                                Download Allowed
                              </option>
                              <option value="view_only">View Only</option>
                              <option value="off">Off</option>
                            </select>
                          ) : (
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-bold">
                                {proj.download_permission === "off"
                                  ? "Off"
                                  : proj.download_permission === "view_only"
                                    ? "View Only"
                                    : "Download Allowed"}
                              </span>
                              <button
                                onClick={() => setEditingPermissionId(proj.id)}
                                className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* My Feedback */}
          <div className="bg-white border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col">
            <div className="bg-[#FFE66D] border-b-4 border-black px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-tighter">
                Reviews Given
              </h2>
              <span className="font-mono font-bold text-xs bg-white border border-black px-2 py-0.5">
                {myFeedbacks.length}
              </span>
            </div>
            <div className="p-0 overflow-y-auto max-h-[800px]">
              {myFeedbacks.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-bold italic">
                  You haven&apos;t reviewed any projects yet.{" "}
                  <Link href="/" className="text-indigo-600 hover:underline">
                    Browse the feed.
                  </Link>
                </div>
              ) : (
                <ul className="divide-y-2 divide-black">
                  {myFeedbacks.map((fb) => (
                    <li key={fb.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {fb.vote === "up" ? (
                            <div className="border-2 border-black bg-emerald-100 flex items-center justify-center font-black w-8 h-8 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                              ▲
                            </div>
                          ) : (
                            <div className="border-2 border-black bg-red-100 flex items-center justify-center font-black w-8 h-8 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                              ▼
                            </div>
                          )}
                          <span className="text-xs font-black uppercase tracking-widest text-[#1A1A1A]">
                            Project Review
                          </span>
                        </div>
                        <Link
                          href={`/project/${fb.project_id}`}
                          className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black hover:opacity-70"
                        >
                          Go to project
                        </Link>
                      </div>
                      {fb.has_text ? (
                        <div className="text-sm font-bold italic mb-4 line-clamp-3">
                          &quot;{fb.whats_good || fb.whats_improvable}&quot;
                        </div>
                      ) : (
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                          Voted without text feedback
                        </div>
                      )}

                      {fb.marked_helpful && (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-1 inline-flex items-center gap-1">
                          ★ Marked Helpful
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
