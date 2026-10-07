"use client";

import { useState } from "react";
import Link from "next/link";
import { doc, updateDoc } from "firebase/firestore";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

export default function BillingPage() {
  const { user, userProfile, refreshProfile, openAuth, toast } = useAuth();
  const [loading, setLoading] = useState(false);

  const setPlan = async (status: "active" | "inactive") => {
    if (!user) {
      openAuth("login");
      return;
    }
    setLoading(true);
    try {
      // Demo checkout: no payment provider is connected yet, so no money moves.
      await updateDoc(doc(db, "users", user.uid), { subscription_status: status });
      await refreshProfile();
      toast(status === "active" ? "You're on Pro (demo mode, no charge)." : "Back on the Free plan.", "success");
    } catch (err) {
      console.error(err);
      toast("Couldn't change plan. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const isPro = userProfile?.subscription_status === "active";

  const free = ["Up to 5 projects", "50MB max file size", "15 reviews per day"];
  const pro = ["Unlimited projects", "500MB max file size", "No review limit", "Pro badge on your plan"];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-grow">
      <Link
        href={user ? "/profile" : "/"}
        className="inline-flex items-center text-sm font-bold text-fog hover:text-acid mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to {user ? "profile" : "home"}
      </Link>

      <div className="mb-10">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">Plans</h1>
        <p className="text-fog text-lg">
          {user ? (
            <>
              Current plan:{" "}
              <span className={`chip ${isPro ? "text-acid border-acid/50" : ""}`}>{isPro ? "pro" : "free"}</span>
            </>
          ) : (
            "Choose a plan to get started."
          )}
        </p>
        <p className="mono text-[11px] text-fog mt-3">
          Demo mode: upgrading unlocks Pro limits instantly without a payment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`card p-7 flex flex-col ${!isPro && user ? "border-acid" : ""}`}>
          <h2 className="text-2xl font-black mb-1">Free</h2>
          <div className="text-4xl font-black mb-6">
            $0 <span className="text-base text-fog font-medium">/mo</span>
          </div>
          <ul className="space-y-3 mb-8 flex-grow">
            {free.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-acid shrink-0" /> {f}
              </li>
            ))}
          </ul>
          {!user ? (
            <button onClick={() => openAuth("signup")} className="btn btn-ghost">Sign up free</button>
          ) : !isPro ? (
            <div className="btn btn-ghost opacity-60 cursor-default">Current plan</div>
          ) : (
            <button disabled={loading} onClick={() => setPlan("inactive")} className="btn btn-ghost hover:border-alert hover:text-alert">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Downgrade to Free"}
            </button>
          )}
        </div>

        <div className={`card p-7 flex flex-col relative overflow-hidden ${isPro ? "border-acid" : "border-ghost"}`}>
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-ghost/30 blur-3xl pointer-events-none" />
          <h2 className="text-2xl font-black mb-1 relative">Pro</h2>
          <div className="text-4xl font-black mb-6 relative">
            $9 <span className="text-base text-fog font-medium">/mo</span>
          </div>
          <ul className="space-y-3 mb-8 flex-grow relative">
            {pro.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-acid shrink-0" /> {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <div className="btn btn-acid cursor-default relative">Active plan</div>
          ) : (
            <button disabled={loading} onClick={() => setPlan("active")} className="btn btn-acid relative">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : user ? "Upgrade to Pro" : "Log in to upgrade"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
