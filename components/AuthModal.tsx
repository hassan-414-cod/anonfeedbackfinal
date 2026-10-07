"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Loader2, X } from "lucide-react";

function generateHandle() {
  const adjectives = [
    "Neon",
    "Retro",
    "Lunar",
    "Cyber",
    "Cosmic",
    "Pixel",
    "Quantum",
    "Crypto",
    "Holo",
    "Astro",
  ];
  const nouns = [
    "Builder",
    "Crafter",
    "Hacker",
    "Coder",
    "Designer",
    "Maker",
    "Creator",
    "Smith",
    "Ninja",
    "Wizard",
  ];
  const num = Math.floor(Math.random() * 9000) + 1000;
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}#${num}`;
}

export default function AuthModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const handle = generateHandle();
        await setDoc(doc(db, "users", cred.user.uid), {
          email,
          anonymous_handle: handle,
          builder_score: 0,
          reviewer_score: 0,
          created_at: serverTimestamp(),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-black transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-black mb-2">
            {isLogin ? "Welcome Back" : "Join Anonymously"}
          </h2>
          <p className="text-gray-500 font-medium text-sm">
            {isLogin
              ? "Sign in to continue."
              : "We require email for spam prevention, but your identity is never shared."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 font-medium p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-700">
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-50 transition-all font-medium"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-700">
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-50 transition-all font-medium"
              placeholder="••••••••"
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-[#FF5A5F] text-white font-bold rounded-xl py-3 flex justify-center items-center h-12 mt-2 transition-all hover:bg-[#ff6e72]"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>
        <div className="mt-6 text-center text-sm font-medium text-gray-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <br />
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-black font-bold mt-2 hover:underline"
          >
            {isLogin ? "Join now" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
