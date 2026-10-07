"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "@/lib/local-db";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "@/lib/local-storage";
import {
  PlusCircle,
  MessageSquare,
  Clock,
  Folder,
  Link as LinkIcon,
  FileText,
  Code,
  Video,
  Image as ImageIcon,
  Upload,
  ArrowRight,
  Loader2,
  Trash2,
  X,
  ArrowBigUp,
  ArrowBigDown,
} from "lucide-react";
import { db } from "@/lib/local-db";
import { storage } from "@/lib/local-storage";
import { useAuth } from "@/lib/auth-context";
import {
  CATEGORIES,
  FREE_MAX_MB,
  FREE_MAX_UPLOADS,
  PRO_MAX_MB,
  timeAgo,
  toMillis,
} from "@/lib/helpers";
import Gate from "@/components/Gate";
import { ProjectCover } from "@/components/ProjectCard";

const TABS = [
  { id: "my-projects", label: "My Projects", icon: Folder },
  { id: "new-project", label: "New Project", icon: PlusCircle },
  { id: "history", label: "History", icon: Clock },
  { id: "chat-rooms", label: "Chat Rooms", icon: MessageSquare },
];

const TYPES = [
  { id: "link", label: "Website Link", icon: LinkIcon },
  { id: "doc", label: "Document", icon: FileText },
  { id: "code", label: "Code Snippet", icon: Code },
  { id: "image", label: "Image / Design", icon: ImageIcon },
  { id: "video", label: "Video Demo", icon: Video },
];

const ACCEPT: Record<string, string> = {
  doc: ".pdf,.doc,.docx,.txt,.md,application/pdf",
  image: "image/*",
  video: "video/*",
};

function tabFromParam(tab: string | null) {
  if (tab === "new") return "new-project";
  if (tab === "chat") return "chat-rooms";
  return TABS.some((t) => t.id === tab) ? (tab as string) : "my-projects";
}

/* ---------------------------------------------------------------- */
function MyProjects({ onNew }: { onNew: () => void }) {
  const { user, toast } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const snap = await getDocs(
        query(collection(db, "projects"), where("owner_user_id", "==", user.uid)),
      );
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      list.sort((a, b) => toMillis(b.created_at) - toMillis(a.created_at));
      setProjects(list);
    } catch (e) {
      console.error(e);
      toast("Couldn't load your projects.", "error");
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (p: any) => {
    if (!window.confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    try {
      await deleteDoc(doc(db, "projects", p.id));
      if (p.file_path) {
        deleteObject(ref(storage, p.file_path)).catch(() => {});
      }
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
      toast("Project deleted.", "success");
    } catch (e) {
      console.error(e);
      toast("Couldn't delete that project.", "error");
    }
  };

  return (
    <div className="fade-up">
      <div className="flex justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">My Projects</h1>
          <p className="text-fog mt-1">Manage and view feedback for what you uploaded.</p>
        </div>
        <button onClick={onNew} className="btn btn-acid shrink-0">
          <PlusCircle className="w-4 h-4" /> Upload new
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-acid" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card border-dashed py-16 px-6 text-center">
          <Folder className="w-10 h-10 text-fog mx-auto mb-3" />
          <p className="font-bold mb-1">You haven&apos;t uploaded anything yet.</p>
          <p className="text-fog text-sm mb-5">Post your first project and get anonymous feedback.</p>
          <button onClick={onNew} className="btn btn-acid">Upload a project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((p) => (
            <div key={p.id} className="card overflow-hidden flex flex-col">
              <Link href={`/project/${p.id}`}>
                <ProjectCover project={p} className="h-32" />
              </Link>
              <div className="p-5 flex flex-col flex-grow">
                <Link href={`/project/${p.id}`} className="font-bold text-lg hover:text-acid line-clamp-1">
                  {p.title}
                </Link>
                <p className="text-sm text-fog line-clamp-2 mt-1 mb-4 flex-grow">{p.description}</p>
                <div className="flex justify-between items-center pt-3 border-t border-line text-xs">
                  <span className="font-bold text-acid">
                    {p.feedback_count || 0} review{(p.feedback_count || 0) === 1 ? "" : "s"}
                  </span>
                  <span className="mono text-fog">{timeAgo(p.created_at)}</span>
                  <button
                    onClick={() => remove(p)}
                    aria-label={`Delete ${p.title}`}
                    className="text-fog hover:text-alert p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
function NewProject({ initialType }: { initialType: string }) {
  const { user, userProfile, toast } = useAuth();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [type, setType] = useState(TYPES.some((t) => t.id === initialType) ? initialType : "link");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [permission, setPermission] = useState("view_only");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isPro = userProfile?.subscription_status === "active";
  const maxMb = isPro ? PRO_MAX_MB : FREE_MAX_MB;
  const needsFile = type === "doc" || type === "image" || type === "video";

  const pickFile = (f: File | undefined | null) => {
    if (!f) return;
    if (f.size > maxMb * 1024 * 1024) {
      setError(`That file is over your ${maxMb}MB limit.${isPro ? "" : " Upgrade to Pro for 500MB."}`);
      return;
    }
    setError("");
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;
    setError("");

    if (needsFile && !file) {
      setError("Choose a file to upload.");
      return;
    }

    setSubmitting(true);
    try {
      if (!isPro) {
        const mine = await getDocs(
          query(collection(db, "projects"), where("owner_user_id", "==", user.uid)),
        );
        if (mine.size >= FREE_MAX_UPLOADS) {
          setError(`Free plan allows ${FREE_MAX_UPLOADS} projects. Delete one or upgrade to Pro.`);
          setSubmitting(false);
          return;
        }
      }

      const data: Record<string, any> = {
        owner_user_id: user.uid,
        owner_handle: userProfile.anonymous_handle,
        title: title.trim(),
        category,
        description: description.trim(),
        type,
        upvotes: 0,
        downvotes: 0,
        feedback_count: 0,
        download_permission: permission,
        created_at: serverTimestamp(),
      };

      if (type === "link") data.link_or_file_url = url.trim();
      if (type === "code") data.code_snippet = code;

      if (needsFile && file) {
        const path = `projects/${user.uid}/${Date.now()}_${file.name.replace(/[^\w.\-]/g, "_")}`;
        const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type });
        await new Promise<void>((resolve, reject) => {
          task.on(
            "state_changed",
            (s) => setProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
            reject,
            () => resolve(),
          );
        });
        data.file_url = await getDownloadURL(task.snapshot.ref);
        data.file_path = path;
        data.file_name = file.name;
        data.file_type = file.type;
        data.file_size = file.size;
      }

      const created = await addDoc(collection(db, "projects"), data);
      toast("Project published anonymously.", "success");
      router.push(`/project/${created.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Upload failed. Try again.");
      setSubmitting(false);
      setProgress(null);
    }
  };

  return (
    <div className="fade-up max-w-3xl">
      <h1 className="text-3xl font-black tracking-tight mb-1">Upload a project</h1>
      <p className="text-fog mb-8">Pick a type, describe what you want torn apart, publish under your mask.</p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-8">
        {TYPES.map((pt) => {
          const Icon = pt.icon;
          const on = type === pt.id;
          return (
            <button
              key={pt.id}
              type="button"
              onClick={() => {
                setType(pt.id);
                setFile(null);
                setError("");
              }}
              aria-pressed={on}
              className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border transition-all ${
                on
                  ? "border-acid bg-acid/10 text-acid"
                  : "border-line bg-panel text-fog hover:border-fog hover:text-paper"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-bold text-center">{pt.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div role="alert" className="bg-alert/10 border border-alert/40 text-alert p-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="label" htmlFor="p-title">Project title</label>
            <input
              id="p-title"
              required
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field"
              placeholder="E.g. New landing page design"
            />
          </div>
          <div>
            <label className="label" htmlFor="p-cat">Category</label>
            <select id="p-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="field">
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {type === "link" && (
          <div>
            <label className="label" htmlFor="p-url">Website URL</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fog" />
              <input
                id="p-url"
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="field pl-11"
                placeholder="https://…"
              />
            </div>
          </div>
        )}

        {type === "code" && (
          <div>
            <label className="label" htmlFor="p-code">Code snippet</label>
            <textarea
              id="p-code"
              required
              rows={8}
              maxLength={20000}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="field mono text-sm"
              placeholder="Paste your code here…"
            />
          </div>
        )}

        {needsFile && (
          <div>
            <span className="label">Upload file (max {maxMb}MB)</span>
            <input
              ref={fileInput}
              type="file"
              hidden
              accept={ACCEPT[type]}
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            {file ? (
              <div className="card flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="font-bold truncate">{file.name}</div>
                  <div className="mono text-xs text-fog">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  aria-label="Remove file"
                  className="text-fog hover:text-alert p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  pickFile(e.dataTransfer.files?.[0]);
                }}
                className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center transition-colors ${
                  dragging ? "border-acid bg-acid/5" : "border-line bg-panel hover:border-fog"
                }`}
              >
                <Upload className="w-8 h-8 text-fog mb-3" />
                <span className="text-sm font-bold">Click to upload or drag &amp; drop</span>
                <span className="text-xs text-fog mt-1">
                  {type === "doc" ? "PDF, DOC, TXT, MD" : type === "image" ? "JPG, PNG, GIF, WEBP" : "MP4, MOV, WEBM"}
                </span>
              </button>
            )}
          </div>
        )}

        {needsFile && (
          <div>
            <label className="label" htmlFor="p-perm">Who can download the file?</label>
            <select id="p-perm" value={permission} onChange={(e) => setPermission(e.target.value)} className="field">
              <option value="view_only">View only (no download button)</option>
              <option value="download_allowed">Download allowed</option>
              <option value="off">Hide the file completely</option>
            </select>
          </div>
        )}

        <div>
          <label className="label" htmlFor="p-desc">What do you want feedback on?</label>
          <textarea
            id="p-desc"
            required
            rows={4}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="field"
            placeholder="I'm unsure about the colour scheme and the copy on the hero section…"
          />
        </div>

        {progress !== null && (
          <div>
            <div className="h-2 rounded-full bg-panel-2 overflow-hidden">
              <div className="h-full bg-acid transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mono text-xs text-fog mt-1">uploading {progress}%</div>
          </div>
        )}

        <button disabled={submitting} className="btn btn-acid h-12 px-8 w-full sm:w-auto">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish anonymously"}
        </button>
      </form>
    </div>
  );
}

/* ---------------------------------------------------------------- */
function History() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "feedback"), where("reviewer_user_id", "==", user.uid)),
        );
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
        list.sort((a, b) => toMillis(b.created_at) - toMillis(a.created_at));
        const top = list.slice(0, 30);
        await Promise.all(
          top.map(async (f) => {
            try {
              const p = await getDoc(doc(db, "projects", f.project_id));
              f.project_title = p.exists() ? p.data().title : "(deleted project)";
            } catch {
              f.project_title = "Project";
            }
          }),
        );
        setItems(top);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="fade-up">
      <h1 className="text-3xl font-black tracking-tight mb-1">History</h1>
      <p className="text-fog mb-8">Projects you have reviewed.</p>
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-acid" />
        </div>
      ) : items.length === 0 ? (
        <div className="card border-dashed py-16 px-6 text-center">
          <Clock className="w-10 h-10 text-fog mx-auto mb-3" />
          <p className="text-fog mb-5">Your history will appear here once you start reviewing.</p>
          <Link href="/feed" className="btn btn-acid">Find something to review</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((f) => (
            <li key={f.id}>
              <Link
                href={`/project/${f.project_id}`}
                className="card flex items-center gap-4 p-4 hover:border-acid/60 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${f.vote === "up" ? "bg-acid/15 text-acid" : "bg-alert/15 text-alert"}`}>
                  {f.vote === "up" ? <ArrowBigUp /> : <ArrowBigDown />}
                </div>
                <div className="min-w-0 flex-grow">
                  <div className="font-bold truncate">{f.project_title}</div>
                  <div className="text-xs text-fog truncate">
                    {f.has_text ? f.whats_good || f.whats_improvable || f.suggested_next_step : "Voted without text"}
                  </div>
                </div>
                <span className="mono text-[10px] text-fog shrink-0">{timeAgo(f.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
function ProjectsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(tabFromParam(searchParams.get("tab")));

  useEffect(() => {
    setActiveTab(tabFromParam(searchParams.get("tab")));
  }, [searchParams]);

  const go = (id: string) => {
    if (id === "chat-rooms") {
      router.push("/rooms");
      return;
    }
    setActiveTab(id);
    router.replace(`/projects?tab=${id === "new-project" ? "new" : id}`, { scroll: false });
  };

  return (
    <div className="flex flex-col md:flex-row w-full flex-grow">
      <aside className="md:w-60 shrink-0 md:border-r border-line md:py-8 px-4 md:px-4 pt-4">
        <div className="hidden md:block px-3 mb-3 label">Dashboard</div>
        <nav className="flex md:flex-col gap-2 overflow-x-auto scrollbar-hide pb-3 md:pb-0 md:sticky md:top-24" aria-label="Dashboard">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const on = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => go(tab.id)}
                aria-current={on ? "page" : undefined}
                className={`flex items-center gap-3 px-4 py-2.5 md:py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                  on
                    ? "bg-acid/10 text-acid border-acid/40"
                    : "text-fog border-transparent hover:text-paper hover:bg-panel-2"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {tab.id === "chat-rooms" && <ArrowRight className="w-4 h-4 ml-auto hidden md:block" />}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-grow p-4 sm:p-6 md:p-10 min-w-0">
        {!user ? (
          <Gate message={loading ? "" : "Log in or join to manage projects and upload new ones."} />
        ) : activeTab === "new-project" ? (
          <NewProject key={searchParams.get("type") || "link"} initialType={searchParams.get("type") || "link"} />
        ) : activeTab === "history" ? (
          <History />
        ) : (
          <MyProjects onNew={() => go("new-project")} />
        )}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-fog mono text-sm">
          loading<span className="blink">_</span>
        </div>
      }
    >
      <ProjectsContent />
    </Suspense>
  );
}
