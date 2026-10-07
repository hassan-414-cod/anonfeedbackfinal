"use client";

import { useAuth } from "@/lib/auth-context";

export default function Toaster() {
  const { toasts } = useAuth();
  return (
    <div
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-[200] flex flex-col gap-2 items-end pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`fade-up pointer-events-auto max-w-sm w-full sm:w-auto px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl backdrop-blur ${
            t.kind === "success"
              ? "bg-acid/15 border-acid/40 text-acid"
              : t.kind === "error"
                ? "bg-alert/15 border-alert/40 text-alert"
                : "bg-panel-2 border-line text-paper"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
