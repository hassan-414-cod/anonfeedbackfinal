"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { timeAgo } from "@/lib/helpers";
import Gate from "@/components/Gate";

type Report = {
  id: string;
  target_type: "project" | "feedback" | "message";
  target_id: string;
  project_id: string | null;
  reason: string;
  created_at: string;
  preview: string | null;
  author_handle: string | null;
};

export default function AdminPage() {
  const { user, loading: authLoading, toast } = useAuth();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([api("/admin/stats"), api("/admin/reports?status=open")]);
      setStats(s.stats);
      setReports(r.reports);
    } catch (e: any) {
      if (e?.status === 403 || e?.status === 401) setDenied(true);
      else console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user, load]);

  const act = async (id: string, action: "dismiss" | "hide" | "hide_and_ban") => {
    if (action === "hide_and_ban" && !window.confirm("Hide this and ban its author's account?")) return;
    setBusy(id);
    try {
      await api(`/admin/reports/${id}`, { json: { action } });
      toast("Done.", "success");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Action failed.", "error");
    } finally {
      setBusy(null);
    }
  };

  if (!user) return <Gate message="Staff only. Log in with a moderator account." />;
  if (authLoading || loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-acid" />
      </div>
    );
  }
  if (denied) {
    return (
      <div className="px-4 py-24 text-center">
        <h1 className="text-2xl font-black mb-2">Not allowed</h1>
        <p className="text-fog">This area is for moderators and admins.</p>
      </div>
    );
  }

  const tiles: [string, string][] = [
    ["accounts", "Accounts"],
    ["projects", "Projects"],
    ["feedback", "Reviews"],
    ["messages", "Chat messages"],
    ["pro_users", "Pro users"],
    ["open_reports", "Open reports"],
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="chip mb-3">
        <ShieldCheck className="w-3.5 h-3.5" /> staff
      </div>
      <h1 className="text-3xl font-black tracking-tight mb-6">Moderation</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        {tiles.map(([key, label]) => (
          <div key={key} className="card p-4">
            <div className="mono text-[10px] uppercase tracking-widest text-fog">{label}</div>
            <div className="text-2xl font-black">{stats?.[key] ?? "–"}</div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-black mb-3">Open reports</h2>
      {reports.length === 0 ? (
        <div className="card p-8 text-center text-fog">Nothing to review. Quiet day.</div>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="chip">{r.target_type}</span>
                <span className="chip">{r.reason}</span>
                <span className="mono text-[11px] text-fog">{timeAgo(r.created_at)}</span>
                {r.author_handle && <span className="mono text-[11px] text-fog">by {r.author_handle}</span>}
              </div>
              <p className="text-sm whitespace-pre-wrap break-words mb-4">
                {r.preview ?? "(content already removed)"}
              </p>
              <div className="flex flex-wrap gap-2">
                <button disabled={busy === r.id} onClick={() => act(r.id, "dismiss")} className="btn btn-ghost text-xs py-2">
                  Dismiss
                </button>
                <button disabled={busy === r.id} onClick={() => act(r.id, "hide")} className="btn btn-ghost text-xs py-2">
                  Hide content
                </button>
                <button disabled={busy === r.id} onClick={() => act(r.id, "hide_and_ban")} className="btn btn-alert text-xs py-2">
                  Hide + ban author
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
