"use client";

import { useEffect, useState, use } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import {
  ExternalLink,
  Loader2,
  ArrowLeft,
  Download,
  AlertTriangle,
  Share2,
  Flag,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { user, userProfile } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [myFeedback, setMyFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Form state
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [whatsGood, setWhatsGood] = useState("");
  const [whatsImprovable, setWhatsImprovable] = useState("");
  const [suggestedStep, setSuggestedStep] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [reportingItem, setReportingItem] = useState<{
    type: "project" | "feedback";
    id: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState("Spam");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pDoc = await getDoc(doc(db, "projects", id));
        if (pDoc.exists()) {
          setProject({ id: pDoc.id, ...pDoc.data() });
        }

        const q = query(
          collection(db, "feedback"),
          where("project_id", "==", id),
        );
        const fDocs = await getDocs(q);
        const fList = fDocs.docs.map((d) => ({ id: d.id, ...d.data() }));

        // sort by newest
        fList.sort((a, b) => {
          const aTime = a.created_at?.toMillis ? a.created_at.toMillis() : 0;
          const bTime = b.created_at?.toMillis ? b.created_at.toMillis() : 0;
          return bTime - aTime;
        });

        setFeedbacks(fList);

        if (user) {
          const mine = fList.find((f) => f.reviewer_user_id === user.uid);
          if (mine) setMyFeedback(mine);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vote || !user || !userProfile) return;

    // Minimum 20 characters
    if (
      (whatsGood && whatsGood.length < 20) ||
      (whatsImprovable && whatsImprovable.length < 20) ||
      (suggestedStep && suggestedStep.length < 20)
    ) {
      setErrorMsg("Each text field must be at least 20 characters if filled.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      // Check rate limit if not Pro
      if (userProfile.subscription_status !== "active") {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const rateLimitQ = query(
          collection(db, "feedback"),
          where("reviewer_user_id", "==", user.uid),
          where("created_at", ">=", yesterday),
        );
        const recentFeedbacks = await getDocs(rateLimitQ);
        if (recentFeedbacks.size >= 15) {
          setErrorMsg(
            "You have reached the free limit of 15 reviews per 24 hours.",
          );
          setSubmitting(false);
          return;
        }
      }

      const batch = writeBatch(db);
      const feedbackId = `${id}_${user.uid}`;
      const feedbackRef = doc(db, "feedback", feedbackId);

      const isFullFeedback =
        whatsGood.trim().length > 0 || whatsImprovable.trim().length > 0;

      batch.set(feedbackRef, {
        project_id: id,
        reviewer_user_id: user.uid,
        reviewer_handle: userProfile.anonymous_handle,
        vote: vote,
        whats_good: whatsGood,
        whats_improvable: whatsImprovable,
        suggested_next_step: suggestedStep,
        has_text: isFullFeedback,
        marked_helpful: false,
        created_at: new Date(),
      });

      const pRef = doc(db, "projects", id);
      if (vote === "up") {
        batch.update(pRef, { upvotes: increment(1) });
      } else {
        batch.update(pRef, { downvotes: increment(1) });
      }

      if (vote === "up" && project.owner_user_id) {
        batch.update(doc(db, "users", project.owner_user_id), {
          builder_score: increment(1),
        });
      }

      await batch.commit();
      window.location.reload();
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to submit feedback. Check rate limit.");
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (feedbackId: string, reviewerId: string) => {
    if (!user || user.uid !== project?.owner_user_id) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "feedback", feedbackId), { marked_helpful: true });
      batch.update(doc(db, "users", reviewerId), {
        reviewer_score: increment(1),
      });
      await batch.commit();

      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === feedbackId ? { ...f, marked_helpful: true } : f,
        ),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportingItem || !user) return;
    setReporting(true);
    try {
      const batch = writeBatch(db);
      const reportRef = doc(collection(db, "reports"));
      batch.set(reportRef, {
        target_type: reportingItem.type,
        target_id: reportingItem.id,
        reporter_user_id: user.uid,
        reason: reportReason,
        created_at: new Date(),
      });
      await batch.commit();
      setReportingItem(null);
      alert("Report submitted successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to submit report.");
    } finally {
      setReporting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Web App": "bg-indigo-100",
      "Mobile App": "bg-blue-100",
      Design: "bg-emerald-100",
      Video: "bg-purple-100",
      Code: "bg-amber-100",
      "Business Idea": "bg-pink-100",
    };
    return colors[category] || "bg-gray-100";
  };

  const renderFilePreview = (project: any) => {
    if (project.download_permission === "off") {
      return (
        <div className="bg-gray-100 border-b-4 border-black p-12 text-center flex flex-col items-center justify-center">
          <AlertTriangle className="h-12 w-12 mb-4 text-gray-400" />
          <p className="text-xl font-black uppercase italic text-gray-500">
            Owner has disabled file access.
          </p>
          <p className="text-sm font-bold text-gray-500 mt-2">
            Contact via feedback only.
          </p>
        </div>
      );
    }

    const fileUrl = project.file_url;
    const fileType = project.file_type || "";

    if (!fileUrl) {
      if (project.cover_image_url) {
        return (
          <div className="h-64 sm:h-96 w-full border-b-4 border-black bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          </div>
        );
      }
      return null;
    }

    let preview = null;
    if (fileType.startsWith("image/")) {
      preview = (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fileUrl}
          alt="File preview"
          className="max-h-96 w-auto mx-auto object-contain"
          onContextMenu={
            project.download_permission === "view_only"
              ? (e) => e.preventDefault()
              : undefined
          }
        />
      );
    } else if (fileType === "application/pdf") {
      preview = (
        <iframe
          src={fileUrl + "#toolbar=0"}
          className="w-full h-96"
          title="PDF Preview"
        />
      );
    } else if (fileType.startsWith("video/")) {
      preview = (
        <video
          src={fileUrl}
          controls
          className="w-full max-h-96 bg-black"
          controlsList={
            project.download_permission === "view_only" ? "nodownload" : ""
          }
        />
      );
    } else if (fileType.startsWith("audio/")) {
      preview = (
        <audio
          src={fileUrl}
          controls
          className="w-full my-12 px-8"
          controlsList={
            project.download_permission === "view_only" ? "nodownload" : ""
          }
        />
      );
    } else {
      preview = (
        <div className="text-center py-16 flex flex-col items-center justify-center">
          <p className="text-xl font-bold font-mono">
            {project.file_name || "File attached"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {Math.round((project.file_size || 0) / 1024)} KB
          </p>
        </div>
      );
    }

    return (
      <div className="border-b-4 border-black bg-[#f8f8f8] relative overflow-hidden flex flex-col justify-center min-h-[300px]">
        {preview}
        {project.download_permission === "download_allowed" && (
          <div className="absolute top-4 right-4 z-10">
            <a
              href={fileUrl}
              target="_blank"
              download
              className="inline-flex items-center px-4 py-2 bg-[#FFE66D] border-2 border-black font-black uppercase italic text-xs shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <Download className="w-4 h-4 mr-2" /> Download
            </a>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full flex-grow p-6 sm:p-8 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 mb-8 rounded"></div>
        <div className="bg-white border-4 border-gray-200 h-96 mb-12"></div>
        <div className="h-12 w-48 bg-gray-200 mb-8 rounded"></div>
      </div>
    );
  }

  if (!project)
    return (
      <div className="p-20 text-center font-black uppercase italic text-2xl">
        Project not found
      </div>
    );

  const isOwner = user?.uid === project.owner_user_id;

  return (
    <div className="w-full flex-grow p-6 sm:p-8">
      <Link
        href="/"
        className="inline-flex items-center text-xs font-black tracking-widest uppercase border-b-2 border-black text-[#1A1A1A] hover:opacity-70 mb-8 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Feed
      </Link>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] mb-12 relative overflow-hidden">
        {renderFilePreview(project)}

        <div className="p-6 sm:p-10 relative">
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center px-3 py-2 border-2 border-black bg-white text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <Share2 className="w-3 h-3 mr-1" /> {copied ? "Copied!" : "Share"}
            </button>
            <button
              onClick={() =>
                setReportingItem({ type: "project", id: project.id })
              }
              className="inline-flex items-center px-3 py-2 border-2 border-black bg-white text-[10px] font-black uppercase tracking-widest text-red-500 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <Flag className="w-3 h-3 mr-1" /> Report
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6 pt-8 sm:pt-0">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`text-[10px] font-black uppercase italic px-2 py-1 border-2 border-black ${getCategoryColor(project.category)}`}
                >
                  {project.category}
                </span>
                <span className="text-[10px] font-mono font-bold border-2 border-black px-2 py-1 bg-gray-100 opacity-80">
                  {project.owner_handle}
                </span>
                {project.created_at && (
                  <span className="text-[10px] font-bold uppercase text-gray-500 italic hidden sm:inline-block">
                    {formatDistanceToNow(
                      project.created_at.toDate
                        ? project.created_at.toDate()
                        : new Date(project.created_at),
                    )}{" "}
                    ago
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter text-black uppercase leading-none">
                {project.title}
              </h1>
            </div>
            {project.link_or_file_url && (
              <a
                href={project.link_or_file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-6 py-3 border-2 border-black text-xs font-black uppercase tracking-widest bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none flex-shrink-0 transition-all"
              >
                <ExternalLink className="mr-2 h-4 w-4" /> Open Link
              </a>
            )}
          </div>

          <div className="text-lg font-bold italic text-gray-800 mb-8 max-w-3xl leading-relaxed whitespace-pre-wrap">
            {project.description}
          </div>

          <div className="flex items-center gap-8 border-t-4 border-black border-dashed pt-8">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="border-2 border-black bg-emerald-100 px-3 py-1 font-black text-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                ▲
              </div>
              <span className="text-4xl font-black">
                {project.upvotes || 0}
              </span>
            </div>
            <div className="flex items-center gap-3 text-red-600">
              <div className="border-2 border-black bg-red-100 px-3 py-1 font-black text-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                ▼
              </div>
              <span className="text-4xl font-black">
                {project.downvotes || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-8 bg-[#FFE66D] inline-block px-4 py-2 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          Feedback ({feedbacks.length})
        </h2>

        {/* LEAVE FEEDBACK FORM */}
        {!isOwner && !myFeedback && user && (
          <div className="bg-[#f0f0f0] border-4 border-black p-6 sm:p-10 mb-12 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">
              Leave Feedback
            </h3>
            {errorMsg && (
              <div className="bg-[#FF6B6B] border-2 border-black text-white font-bold p-3 mb-6 uppercase text-sm tracking-wide">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleSubmitFeedback} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-3">
                  Overall Vote <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => setVote("up")}
                    className={`flex-1 py-4 px-6 border-2 border-black font-black uppercase italic text-lg flex items-center justify-center gap-3 transition-all ${vote === "up" ? "bg-emerald-400 text-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.2)]" : "bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"}`}
                  >
                    <span className="text-2xl">▲</span> Good
                  </button>
                  <button
                    type="button"
                    onClick={() => setVote("down")}
                    className={`flex-1 py-4 px-6 border-2 border-black font-black uppercase italic text-lg flex items-center justify-center gap-3 transition-all ${vote === "down" ? "bg-red-400 text-black shadow-[inset_4px_4px_0px_rgba(0,0,0,0.2)]" : "bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"}`}
                  >
                    <span className="text-2xl">▼</span> Needs Work
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2">
                    What&apos;s good about this?{" "}
                    <span className="text-gray-500 lowercase">
                      (min 20 chars)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={whatsGood}
                    onChange={(e) => setWhatsGood(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black outline-none focus:bg-[#FDFCFB] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all font-bold resize-none"
                    placeholder="e.g. The layout is very intentional..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2">
                    What could be improved?{" "}
                    <span className="text-gray-500 lowercase">
                      (min 20 chars)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={whatsImprovable}
                    onChange={(e) => setWhatsImprovable(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black outline-none focus:bg-[#FDFCFB] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all font-bold resize-none"
                    placeholder="e.g. Navigation is hard to find..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2">
                    Suggested Next Step{" "}
                    <span className="text-gray-500 lowercase">
                      (min 20 chars)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={suggestedStep}
                    onChange={(e) => setSuggestedStep(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black outline-none focus:bg-[#FDFCFB] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all font-bold resize-none"
                    placeholder="e.g. Move the menu to the top right."
                  />
                </div>
              </div>

              <button
                disabled={!vote || submitting}
                type="submit"
                className="bg-[#FF6B6B] border-2 border-black text-black font-black uppercase tracking-tighter py-4 px-8 text-xl shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all w-full mt-4 disabled:opacity-50 flex items-center justify-center"
              >
                {submitting ? (
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                ) : (
                  "Submit Feedback"
                )}
              </button>
            </form>
          </div>
        )}

        {!user && (
          <div className="bg-[#FFE66D] border-4 border-black p-8 text-center shadow-[6px_6px_0px_rgba(0,0,0,1)] mb-12">
            <p className="text-xl font-black uppercase italic tracking-tighter mb-6">
              Log in to leave anonymous feedback on this project.
            </p>
            <Link
              href="/login"
              className="inline-block bg-white border-2 border-black font-black uppercase tracking-widest px-6 py-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              Log In To Critique
            </Link>
          </div>
        )}

        {isOwner && feedbacks.length === 0 && (
          <div className="text-center py-16 border-4 border-black border-dashed bg-white">
            <p className="text-xl font-black uppercase italic tracking-tighter text-gray-500">
              No feedback yet. Share your project to get reviewed!
            </p>
          </div>
        )}

        {/* FEEDBACK FEED */}
        <div className="space-y-6">
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              className="bg-white border-2 border-black p-6 flex flex-col md:flex-row gap-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] relative group"
            >
              <button
                onClick={() =>
                  setReportingItem({ type: "feedback", id: fb.id })
                }
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Flag className="w-4 h-4" />
              </button>

              <div className="flex-shrink-0 flex items-center md:items-start md:flex-col gap-4 w-full md:w-32 border-b-2 border-black md:border-b-0 md:border-r-2 border-dashed pb-4 md:pb-0 md:pr-4">
                {fb.vote === "up" ? (
                  <div className="bg-emerald-400 border-2 border-black w-10 h-10 flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    ▲
                  </div>
                ) : (
                  <div className="bg-red-400 border-2 border-black w-10 h-10 flex items-center justify-center font-black text-xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    ▼
                  </div>
                )}
                <div>
                  <div className="font-mono font-bold text-xs bg-gray-100 border border-black px-1.5 py-0.5 inline-block mb-1">
                    {fb.reviewer_handle}
                  </div>
                  <div className="text-[10px] font-black uppercase italic text-gray-400">
                    {fb.created_at &&
                      formatDistanceToNow(
                        fb.created_at.toDate
                          ? fb.created_at.toDate()
                          : new Date(fb.created_at),
                      )}{" "}
                    ago
                  </div>
                </div>
              </div>

              <div className="flex-grow space-y-6 pr-6">
                {fb.has_text ? (
                  <div className="space-y-4">
                    {fb.whats_good && (
                      <div>
                        <span className="text-[10px] font-black uppercase italic px-2 py-1 bg-emerald-100 border border-black inline-block mb-2">
                          What&apos;s Good
                        </span>
                        <p className="text-sm font-bold italic whitespace-pre-wrap">
                          {fb.whats_good}
                        </p>
                      </div>
                    )}
                    {fb.whats_improvable && (
                      <div>
                        <span className="text-[10px] font-black uppercase italic px-2 py-1 bg-red-100 border border-black inline-block mb-2">
                          Needs Fix
                        </span>
                        <p className="text-sm font-bold italic whitespace-pre-wrap">
                          {fb.whats_improvable}
                        </p>
                      </div>
                    )}
                    {fb.suggested_next_step && (
                      <div>
                        <span className="text-[10px] font-black uppercase italic px-2 py-1 bg-[#FFE66D] border border-black inline-block mb-2">
                          Next Step
                        </span>
                        <p className="text-sm font-bold border-l-4 border-black pl-4 py-1 whitespace-pre-wrap">
                          {fb.suggested_next_step}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm font-black uppercase italic text-gray-400 py-4">
                    Voted without text feedback
                  </div>
                )}

                {/* Helpful Mark Section */}
                <div className="pt-4 border-t-2 border-black border-dashed flex items-center justify-between">
                  {fb.marked_helpful ? (
                    <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-3 py-1.5 inline-flex items-center gap-2">
                      ★ Marked Helpful
                    </span>
                  ) : (
                    isOwner &&
                    fb.has_text && (
                      <button
                        onClick={() =>
                          handleMarkHelpful(fb.id, fb.reviewer_user_id)
                        }
                        className="text-[10px] font-black uppercase tracking-widest border-2 border-black bg-white px-3 py-1.5 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all hover:bg-[#FFE66D]"
                      >
                        Mark as Helpful
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      {reportingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-4">
              Report {reportingItem.type}
            </h3>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full border-2 border-black font-bold p-3 mb-6 outline-none"
            >
              <option>Spam</option>
              <option>Abuse</option>
              <option>Irrelevant</option>
              <option>Other</option>
            </select>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setReportingItem(null)}
                className="font-black uppercase tracking-widest text-xs px-4 py-2 border-2 border-transparent hover:border-black transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={reporting}
                className="bg-black text-white font-black uppercase tracking-widest text-xs px-6 py-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
              >
                {reporting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
