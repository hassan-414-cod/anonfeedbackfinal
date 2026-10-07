"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthForm from "./AuthForm";

export default function AuthModal() {
  const { authModal, closeAuth } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(authModal.mode);

  useEffect(() => {
    setMode(authModal.mode);
  }, [authModal.mode, authModal.open]);

  useEffect(() => {
    if (!authModal.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAuth();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [authModal.open, closeAuth]);

  if (!authModal.open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && closeAuth()}
      role="dialog"
      aria-modal="true"
    >
      <div className="fade-up w-full max-w-md card p-6 sm:p-8 relative max-h-[95vh] overflow-y-auto rounded-b-none sm:rounded-b-[1.25rem]">
        <button
          onClick={closeAuth}
          aria-label="Close"
          className="absolute right-4 top-4 text-fog hover:text-paper"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="mb-6">
          <div className="chip mb-3">
            <span className="live-dot" /> identity {mode === "login" ? "check" : "generator"}
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {mode === "login" ? "Welcome back, ghost." : "Put on the mask."}
          </h2>
          <p className="text-fog text-sm mt-1">
            {mode === "login"
              ? "Sign in to pick up where you left off."
              : "Email is only for spam prevention. Everyone else only ever sees your random handle."}
          </p>
        </div>
        <AuthForm mode={mode} onModeChange={setMode} onDone={closeAuth} />
      </div>
    </div>
  );
}
