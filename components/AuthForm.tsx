"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { authMessage } from "@/lib/helpers";
import { useAuth } from "@/lib/auth-context";

export default function AuthForm({
  mode,
  onModeChange,
  onDone,
}: {
  mode: "login" | "signup";
  onModeChange: (m: "login" | "signup") => void;
  onDone: () => void;
}) {
  const { toast, refreshProfile } = useAuth();
  const isLogin = mode === "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api<{ profile: { anonymous_handle: string } }>(isLogin ? "/auth/login" : "/auth/signup", {
        json: { email, password },
      });
      await refreshProfile();
      toast(isLogin ? "Welcome back." : `Mask on. You are ${res.profile.anonymous_handle}.`, "success");
      onDone();
    } catch (err: any) {
      setError(authMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!email) {
      setError("Enter your email above first, then press reset again.");
      return;
    }
    try {
      await api("/auth/password-reset", { json: { email } });
      toast("Password reset email sent.", "success");
      setError("");
    } catch (err: any) {
      setError(authMessage(err));
    }
  };

  return (
    <>
      {error && (
        <div
          role="alert"
          className="bg-alert/10 border border-alert/40 text-alert p-3 rounded-lg mb-5 text-sm"
        >
          {error}
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="auth-email">
            Email {!isLogin && <span className="normal-case">(never shown)</span>}
          </label>
          <input
            id="auth-email"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="auth-password">
            Password
          </label>
          <input
            id="auth-password"
            required
            minLength={6}
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            placeholder="••••••••"
          />
        </div>
        <button disabled={loading} className="btn btn-acid w-full h-12">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isLogin ? (
            "Sign in"
          ) : (
            "Get my anonymous identity"
          )}
        </button>
      </form>
      {isLogin && (
        <button
          type="button"
          onClick={reset}
          className="mt-3 w-full text-center text-xs text-fog hover:text-paper underline"
        >
          Forgot password?
        </button>
      )}
      <div className="mt-6 text-center text-sm text-fog">
        {isLogin ? "New here?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => onModeChange(isLogin ? "signup" : "login")}
          className="text-acid font-bold hover:underline"
        >
          {isLogin ? "Join anonymously" : "Log in"}
        </button>
      </div>
    </>
  );
}
