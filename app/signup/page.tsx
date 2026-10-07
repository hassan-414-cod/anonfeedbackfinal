"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

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

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Create user doc
      const handle = generateHandle();
      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        anonymous_handle: handle,
        builder_score: 0,
        reviewer_score: 0,
        created_at: serverTimestamp(),
      });
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-grow items-center text-center px-4 py-20 w-full">
      <div className="w-full max-w-md bg-white border-4 border-black p-8 sm:p-12 shadow-[8px_8px_0px_rgba(0,0,0,1)] text-left">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2">
            Join Anonymously
          </h1>
          <p className="text-gray-500 font-bold italic text-sm">
            We require email for spam prevention, but your identity is never
            shared.
          </p>
        </div>

        {error && (
          <div className="bg-[#FF6B6B] border-2 border-black text-white font-bold p-3 mb-6 uppercase text-sm tracking-wide">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest">
              Email{" "}
              <span className="text-gray-400 font-bold ml-1">
                (Never shown)
              </span>
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
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>
        <div className="mt-8 text-center text-xs font-black uppercase tracking-widest">
          Already have an account? <br />
          <Link
            href="/login"
            className="text-indigo-600 border-b-2 border-indigo-600 mt-2 inline-block"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
