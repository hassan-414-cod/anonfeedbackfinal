"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  ExternalLink,
  Loader2,
  ArrowLeft,
  Download,
  AlertTriangle,
  Share2,
  Flag,
  ArrowBigUp,
  ArrowBigDown,
  Star,
  X,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import {
  FREE_REVIEWS_PER_DAY,
  categoryTone,
  timeAgo,
  toMillis,
} from "@/lib/helpers";
import Avatar from "@/components/Avatar";

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { user, userProfile, toast, openAuth } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!id) return;
    (async () => {
      try {
        const pDoc = await getDoc(doc(db, "projects", id));
        if (pDoc.exists()) setProject({ id: pDoc.id, ...pDoc.data() });

        const fDocs = await getDocs(
          query(collection(db, "feedback"), where("project_id", "==", id)),
        );
        const list = fDocs.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
        list.sort((a, b) => toMillis(b.created_at) - toMillis(a.created_at));
        setFeedbacks(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const myFeedback = user ? feedbacks.find((f) => f.reviewer_user_id === user.uid) : null;
  const isOwner = !!user && user.uid === project?.owner_user_id;

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vote || !user || !userProfile || !project) return;

    const tooShort = [whatsGood, whatsImprovable, suggestedStep].some(
      (t) => t.trim() && t.trim().length < 20,
    );
    if (tooShort) {
      setErrorMsg("Each text field must be at least 20 characters if filled.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      if (userProfile.subscription_status !== "active") {
        const mine = await getDocs(
          query(collection(db, "feedback"), where("reviewer_user_id", "==", user.uid)),
        );
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const recent = mine.docs.filter((d) => toMillis(d.data().created_at) >= dayAgo);
        if (recent.length >= FREE_REVIEWS_PER_DAY) {
          setErrorMsg(`You've hit the free limit of ${FREE_REVIEWS_PER_DAY} reviews per 24 hours. Upgrade to Pro to remove it.`);
          setSubmitting(false);
          return;
        }
      }

      const batch = writeBatch(db);
      const feedbackRef = doc(db, "feedback", `${id}_${user.uid}`);
      const hasText = whatsGood.trim().length > 0 || whatsImprovable.trim().length > 0 || suggestedStep.trim().length > 0;
      const newFb = {
        project_id: id,
        reviewer_user_id: user.uid,
        reviewer_handle: userProfile.anonymous_handle,
        vote,
        whats_good: whatsGood.trim(),
        whats_improvable: whatsImprovable.trim(),
        suggested_next_step: suggestedStep.trim(),
        has_text: hasText,
        marked_helpful: false,
        created_at: new Date(),
      };
      batch.set(feedbackRef, newFb);

      batch.update(doc(db, "projects", id), {
        [vote === "up" ? "upvotes" : "downvotes"]: increment(1),
        feedback_count: increment(1),
      });

      if (vote === "up" && project.owner_user_id) {
        batch.update(doc(db, "users", project.owner_user_id), {
          builder_score: increment(1),
        });
      }

      await batch.commit();

      setFeedbacks((prev) => [{ id: feedbackRef.id, ...newFb }, ...prev]);
      setProject((p: any) => ({
        ...p,
        upvotes: (p.upvotes || 0) + (vote === "up" ? 1 : 0),
        downvotes: (p.downvotes || 0) + (vote === "down" ? 1 : 0),
      }));
      setVote(null);
      setWhatsGood("");
      setWhatsImprovable("");
      setSuggestedStep("");
      toast("Feedback submitted anonymously.", "success");

      fetch("/api/notify-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id, ownerId: project.owner_user_id }),
      }).catch(() => {});
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (feedbackId: string, reviewerId: string) => {
    if (!isOwner) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "feedback", feedbackId), { marked_helpful: true });
      batch.update(doc(db, "users", reviewerId), { reviewer_score: increment(1) });
      await batch.commit();
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === feedbackId ? { ...f, marked_helpful: true } : f)),
      );
      toast("Marked as helpful. The reviewer earned rep.", "success");
    } catch (e) {
      console.error(e);
      toast("Couldn't mark as helpful.", "error");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: project?.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("Link copied.", "success");
    } catch {
      toast(`Copy this link: ${url}`, "info");
    }
  };

  const handleSubmitReport = async () => {
    if (!reportingItem || !user) return;
    setReporting(true);
    try {
      await addDoc(collection(db, "reports"), {
        target_type: reportingItem.type,
        target_id: reportingItem.id,
        project_id: id,
        reporter_user_id: user.uid,
        reason: reportReason,
        created_at: new Date(),
      });
      setReportingItem(null);
      toast("Report submitted. Thanks for keeping this place clean.", "success");
    } catch (e) {
      console.error(e);
      toast("Failed to submit report.", "error");
    } finally {
      setReporting(false);
    }
  };

  const openReport = (type: "project" | "feedback", targetId: string) => {
    if (!user) {
      openAuth("login");
      return;
    }
    setReportingItem({ type, id: targetId });
  };

  const renderFilePreview = (p: any) => {
    if (!p.file_url) return null;

    if (p.download_permission === "off" && !isOwner) {
      return (
        <div className="bg-panel-2 p-12 text-center flex flex-col items-center">
          <AlertTriangle className="h-10 w-10 mb-3 text-fog" />
          <p className="font-bold">The owner hid the file.</p>
          <p className="text-sm text-fog mt-1">Feedback only — judge it from the description.</p>
        </div>
      );
    }

    const type = p.file_type || "";
    const noDl = p.download_permission !== "download_allowed";
    let preview: React.ReactNode;
    if (type.startsWith("image/")) {
      preview = (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.file_url}
          alt={p.title}
          className="max-h-[28rem] w-auto max-w-full mx-auto object-contain"
          onContextMenu={noDl ? (e) => e.preventDefault() : undefined}
          draggable={!noDl}
        />
      );
    } else if (type === "application/pdf") {
      preview = <iframe src={p.file_url + (noDl ? "#toolbar=0" : "")} className="w-full h-[28rem]" title="PDF preview" />;
    } else if (type.startsWith("video/")) {
      preview = <video src={p.file_url} controls className="w-full max-h-[28rem] bg-black" controlsList={noDl ? "nodownload" : undefined} />;
    } else if (type.startsWith("audio/")) {
      preview = <audio src={p.file_url} controls className="w-full my-12 px-8" />;
    } else {
      preview = (
        <div className="text-center py-16">
          <p className="text-lg font-bold mono">{p.file_name || "File attached"}</p>
          <p className="text-sm text-fog mt-1">{Math.round((p.file_size || 0) / 1024)} KB</p>
        </div>
      );
    }

    return (
      <div className="bg-panel-2 relative flex flex-col justify-center min-h-[220px]">
        {preview}
        {p.download_permission === "download_allowed" && (
          <a
            href={p.file_url}
            target="_blank"
            rel="noreferrer"
            download={p.file_name || true}
            className="absolute top-4 right-4 btn btn-acid"
          >
            <Download className="w-4 h-4" /> Download
          </a>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-8 py-8 animate-pulse">
        <div className="h-5 w-32 bg-panel-2 mb-8 rounded" />
        <div className="card h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="px-4 py-24 text-center">
        <div className="mono text-acid text-6xl font-black mb-4">404</div>
        <h1 className="text-2xl font-black mb-2">Project not found</h1>
        <p className="text-fog mb-6">It may have been deleted by its owner.</p>
        <Link href="/feed" className="btn btn-acid">Back to feed</Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/feed" className="inline-flex items-center text-sm font-bold text-fog hover:text-acid mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to feed
      </Link>

      <article className="card overflow-hidden mb-12">
        {renderFilePreview(project)}
        {!project.file_url && project.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.cover_image_url} alt="Cover" className="w-full h-64 sm:h-96 object-cover" />
        )}

        <div className="p-5 sm:p-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border ${categoryTone(project.category)}`}>
              {project.category}
            </span>
            <span className="flex items-center gap-2 mono text-xs text-fog">
              <Avatar handle={project.owner_handle} size={22} /> {project.owner_handle}
            </span>
            <span className="mono text-[11px] text-fog">{timeAgo(project.created_at)}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-6">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight break-words min-w-0">
              {project.title}
            </h1>
            <div className="flex flex-wrap gap-2 shrink-0">
              {project.link_or_file_url && (
                <a href={project.link_or_file_url} target="_blank" rel="noopener noreferrer" className="btn btn-acid">
                  <ExternalLink className="h-4 w-4" /> Open link
                </a>
              )}
              <button onClick={handleShare} className="btn btn-ghost">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button onClick={() => openReport("project", project.id)} className="btn btn-ghost text-alert">
                <Flag className="w-4 h-4" /> Report
              </button>
            </div>
          </div>

          <p className="text-lg text-paper/90 mb-6 max-w-3xl leading-relaxed whitespace-pre-wrap break-words">
            {project.description}
          </p>

          {project.code_snippet && (
            <pre className="mono text-sm bg-ink border border-line rounded-xl p-4 overflow-x-auto mb-6 max-h-96">
              <code>{project.code_snippet}</code>
            </pre>
          )}

          <div className="flex items-center gap-6 border-t border-dashed border-line pt-6">
            <div className="flex items-center gap-2 text-acid">
              <ArrowBigUp className="w-8 h-8" />
              <span className="text-3xl font-black">{project.upvotes || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-alert">
              <ArrowBigDown className="w-8 h-8" />
              <span className="text-3xl font-black">{project.downvotes || 0}</span>
            </div>
          </div>
        </div>
      </article>

      <section className="mb-12" id="feedback">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-6">
          Feedback <span className="text-acid mono">({feedbacks.length})</span>
        </h2>

        {!user && (
          <div className="card p-8 text-center mb-10 border-acid/30">
            <p className="text-xl font-black mb-4">Log in to leave anonymous feedback.</p>
            <button onClick={() => openAuth("signup")} className="btn btn-acid">
              Join to critique
            </button>
          </div>
        )}

        {user && isOwner && feedbacks.length === 0 && (
          <div className="card border-dashed text-center py-14 px-6 mb-10">
            <p className="font-bold text-fog">No feedback yet. Share your project to get reviewed.</p>
            <button onClick={handleShare} className="btn btn-acid mt-5">
              <Share2 className="w-4 h-4" /> Share project
            </button>
          </div>
        )}

        {user && !isOwner && myFeedback && (
          <div className="card p-5 mb-10 border-acid/30 text-sm text-fog">
            You&apos;ve already reviewed this project. Thanks for the honesty.
          </div>
        )}

        {user && !isOwner && !myFeedback && (
          <div className="card p-5 sm:p-8 mb-10">
            <h3 className="text-xl font-black mb-5">Leave feedback</h3>
            {errorMsg && (
              <div role="alert" className="bg-alert/10 border border-alert/40 text-alert p-3 rounded-lg mb-5 text-sm">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleSubmitFeedback} className="space-y-6">
              <div>
                <span className="label">Overall vote *</span>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVote("up")}
                    aria-pressed={vote === "up"}
                    className={`py-4 rounded-xl border font-black flex items-center justify-center gap-2 transition-all ${
                      vote === "up" ? "bg-acid text-black border-acid" : "border-line bg-panel-2 hover:border-acid text-paper"
                    }`}
                  >
                    <ArrowBigUp className="w-6 h-6" /> Good
                  </button>
                  <button
                    type="button"
                    onClick={() => setVote("down")}
                    aria-pressed={vote === "down"}
                    className={`py-4 rounded-xl border font-black flex items-center justify-center gap-2 transition-all ${
                      vote === "down" ? "bg-alert text-white border-alert" : "border-line bg-panel-2 hover:border-alert text-paper"
                    }`}
                  >
                    <ArrowBigDown className="w-6 h-6" /> Needs work
                  </button>
                </div>
              </div>

              {[
                { label: "What's good about this?", v: whatsGood, set: setWhatsGood, ph: "e.g. The layout is very intentional…" },
                { label: "What could be improved?", v: whatsImprovable, set: setWhatsImprovable, ph: "e.g. Navigation is hard to find…" },
                { label: "Suggested next step", v: suggestedStep, set: setSuggestedStep, ph: "e.g. Move the menu to the top right." },
              ].map((f) => (
                <div key={f.label}>
                  <label className="label">
                    {f.label} <span className="normal-case">(optional, min 20 chars)</span>
                  </label>
                  <textarea
                    rows={2}
                    maxLength={1500}
                    value={f.v}
                    onChange={(e) => f.set(e.target.value)}
                    className="field resize-none"
                    placeholder={f.ph}
                  />
                </div>
              ))}

              <button disabled={!vote || submitting} type="submit" className="btn btn-acid h-12 w-full">
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit feedback"}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="card p-5 sm:p-6 flex flex-col md:flex-row gap-5 relative group">
              <button
                onClick={() => openReport("feedback", fb.id)}
                aria-label="Report this feedback"
                className="absolute top-4 right-4 text-fog hover:text-alert md:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                <Flag className="w-4 h-4" />
              </button>

              <div className="flex md:flex-col items-center md:items-start gap-3 md:w-40 shrink-0 md:border-r border-dashed border-line md:pr-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${fb.vote === "up" ? "bg-acid/15 text-acid" : "bg-alert/15 text-alert"}`}>
                  {fb.vote === "up" ? <ArrowBigUp /> : <ArrowBigDown />}
                </div>
                <div className="min-w-0">
                  <div className="mono text-xs font-bold truncate">{fb.reviewer_handle}</div>
                  <div className="mono text-[10px] text-fog">{timeAgo(fb.created_at)}</div>
                </div>
              </div>

              <div className="flex-grow space-y-4 md:pr-6 min-w-0">
                {fb.has_text ? (
                  <>
                    {fb.whats_good && (
                      <div>
                        <span className="mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-acid/15 text-acid">Good</span>
                        <p className="text-sm mt-2 whitespace-pre-wrap break-words">{fb.whats_good}</p>
                      </div>
                    )}
                    {fb.whats_improvable && (
                      <div>
                        <span className="mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-alert/15 text-alert">Needs fix</span>
                        <p className="text-sm mt-2 whitespace-pre-wrap break-words">{fb.whats_improvable}</p>
                      </div>
                    )}
                    {fb.suggested_next_step && (
                      <div>
                        <span className="mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-ghost/20 text-violet-300">Next step</span>
                        <p className="text-sm mt-2 border-l-2 border-ghost pl-3 whitespace-pre-wrap break-words">{fb.suggested_next_step}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mono text-xs text-fog py-2">voted without text feedback</div>
                )}

                <div className="pt-3 border-t border-dashed border-line">
                  {fb.marked_helpful ? (
                    <span className="mono text-[10px] uppercase tracking-widest bg-acid text-black px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 font-bold">
                      <Star className="w-3 h-3" /> Marked helpful
                    </span>
                  ) : (
                    isOwner &&
                    fb.has_text && (
                      <button onClick={() => handleMarkHelpful(fb.id, fb.reviewer_user_id)} className="btn btn-ghost text-xs py-2">
                        <Star className="w-3.5 h-3.5" /> Mark as helpful
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {reportingItem && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onMouseDown={(e) => e.target === e.currentTarget && setReportingItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="card p-6 sm:p-8 max-w-md w-full fade-up relative">
            <button onClick={() => setReportingItem(null)} aria-label="Close" className="absolute right-4 top-4 text-fog hover:text-paper">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black mb-4 capitalize">Report {reportingItem.type}</h3>
            <label className="label" htmlFor="report-reason">Reason</label>
            <select id="report-reason" value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="field mb-6">
              <option>Spam</option>
              <option>Abuse</option>
              <option>Irrelevant</option>
              <option>Other</option>
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setReportingItem(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSubmitReport} disabled={reporting} className="btn btn-alert">
                {reporting ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
