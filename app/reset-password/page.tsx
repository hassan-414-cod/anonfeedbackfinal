"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { authMessage } from "@/lib/helpers";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/auth/password-reset/confirm", { json: { token, password } });
      setDone(true);
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-grow items-center px-4 py-16 w-full">
      <div className="w-full max-w-md card p-6 sm:p-10">
        <h1 className="text-3xl font-black tracking-tight mb-1">New password</h1>
        {done ? (
          <>
            <p className="text-fog text-sm mb-6">Password updated. Log in with it.</p>
            <Link href="/login" className="btn btn-acid">Log in</Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-6">
            {error && <div role="alert" className="bg-alert/10 border border-alert/40 text-alert p-3 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="label" htmlFor="new-password">Password</label>
              <input
                id="new-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
                autoComplete="new-password"
              />
            </div>
            <button disabled={loading || !token} className="btn btn-acid w-full h-12">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Set password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
