"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-grow items-center text-center px-4 py-20 w-full">
      <div className="w-full max-w-md bg-white border-4 border-black p-8 sm:p-12 shadow-[8px_8px_0px_rgba(0,0,0,1)] text-left">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2">
            Welcome back
          </h1>
          <p className="text-gray-500 font-bold italic text-sm">
            Log in to view your projects and continue giving feedback.
          </p>
        </div>

        {error && (
          <div className="bg-[#FF6B6B] border-2 border-black text-white font-bold p-3 mb-6 uppercase text-sm tracking-wide">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest">
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black outline-none focus:bg-[#FDFCFB] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all font-bold"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest">
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black outline-none focus:bg-[#FDFCFB] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all font-bold"
              placeholder="••••••••"
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-[#FF6B6B] border-2 border-black font-black uppercase tracking-tighter shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all py-3 flex justify-center items-center h-12 mt-4 text-lg"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Log In"}
          </button>
        </form>
        <div className="mt-8 text-center text-xs font-black uppercase tracking-widest">
          Don&apos;t have an account? <br />
          <Link
            href="/signup"
            className="text-indigo-600 border-b-2 border-indigo-600 mt-2 inline-block"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
