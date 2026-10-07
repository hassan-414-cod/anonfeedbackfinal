"use client";

import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Gate({ message }: { message: string }) {
  const { openAuth, loading } = useAuth();
  if (loading) {
    return (
      <div className="py-24 text-center text-fog mono text-sm">
        decrypting<span className="blink">_</span>
      </div>
    );
  }
  return (
    <div className="card border-dashed py-16 px-6 text-center max-w-xl mx-auto my-10">
      <Lock className="w-10 h-10 text-acid mx-auto mb-4" />
      <h2 className="text-2xl font-black mb-2">Mask required</h2>
      <p className="text-fog mb-6">{message}</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <button onClick={() => openAuth("signup")} className="btn btn-acid">
          Join anonymously
        </button>
        <button onClick={() => openAuth("login")} className="btn btn-ghost">
          I have an account
        </button>
      </div>
    </div>
  );
}
