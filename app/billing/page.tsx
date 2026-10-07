"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      // In a real app, this would redirect to Paddle checkout
      // Paddle.Checkout.open({ product: 'pro_plan_id', email: user.email, successCallback: ... })

      // We will mock the success here:
      await updateDoc(doc(db, "users", user.uid), {
        subscription_status: "active",
      });
      alert("Successfully upgraded to PRO!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to upgrade.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // In a real app, this would hit your API to cancel via Paddle API
      await updateDoc(doc(db, "users", user.uid), {
        subscription_status: "inactive",
      });
      alert("Subscription cancelled.");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to cancel.");
    } finally {
      setLoading(false);
    }
  };

  const isPro = userProfile?.subscription_status === "active";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 flex-grow">
      <Link
        href={user ? "/profile" : "/"}
        className="inline-flex items-center text-xs font-black tracking-widest uppercase border-b-2 border-black text-[#1A1A1A] hover:opacity-70 mb-8 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to{" "}
        {user ? "Profile" : "Home"}
      </Link>

      <div className="bg-[#FFE66D] border-4 border-black p-8 sm:p-12 shadow-[8px_8px_0px_rgba(0,0,0,1)] relative mb-12">
        <h1 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4">
          Billing & Plans
        </h1>
        {user ? (
          <p className="text-xl font-bold">
            Current Plan:{" "}
            <span className="bg-white border-2 border-black px-3 py-1 ml-2">
              {isPro ? "PRO" : "FREE"}
            </span>
          </p>
        ) : (
          <p className="text-xl font-bold">Choose a plan to get started.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* FREE PLAN */}
        <div
          className={`bg-white border-4 border-black p-8 flex flex-col ${!isPro ? "shadow-[8px_8px_0px_rgba(0,0,0,1)] ring-4 ring-black ring-offset-4" : "opacity-70 shadow-[4px_4px_0px_rgba(0,0,0,1)]"}`}
        >
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
            Free Tier
          </h2>
          <div className="text-4xl font-black italic mb-6">
            $0 <span className="text-lg text-gray-500">/mo</span>
          </div>

          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-center gap-3 font-bold text-sm">
              <Check className="w-5 h-5 text-emerald-600" /> Max 5 project
              uploads
            </li>
            <li className="flex items-center gap-3 font-bold text-sm">
              <Check className="w-5 h-5 text-emerald-600" /> Max 50MB file size
            </li>
            <li className="flex items-center gap-3 font-bold text-sm">
              <Check className="w-5 h-5 text-emerald-600" /> Rate limited
              feedback (15/day)
            </li>
          </ul>

          {!user ? (
            <Link
              href="/signup"
              className="bg-white border-2 border-black text-black text-center font-black uppercase italic py-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all block"
            >
              Sign up for Free
            </Link>
          ) : !isPro ? (
            <div className="bg-gray-100 border-2 border-black text-center font-black uppercase italic py-4 text-gray-500">
              Current Plan
            </div>
          ) : (
            <button
              disabled={loading}
              onClick={handleCancel}
              className="bg-white border-2 border-black text-black font-black uppercase italic py-4 hover:bg-red-100 transition-colors"
            >
              Downgrade to Free
            </button>
          )}
        </div>

        {/* PRO PLAN */}
        <div
          className={`bg-[#f0f0f0] border-4 border-black p-8 flex flex-col ${isPro ? "shadow-[8px_8px_0px_rgba(0,0,0,1)] ring-4 ring-emerald-400 ring-offset-4" : "shadow-[8px_8px_0px_rgba(0,0,0,1)]"}`}
        >
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
            Pro Tier
          </h2>
          <div className="text-4xl font-black italic mb-6">
            $9 <span className="text-lg text-gray-500">/mo</span>
          </div>

          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-center gap-3 font-bold text-sm">
              <Check className="w-5 h-5 text-emerald-600" /> Unlimited project
              uploads
            </li>
            <li className="flex items-center gap-3 font-bold text-sm">
              <Check className="w-5 h-5 text-emerald-600" /> Max 500MB file size
            </li>
            <li className="flex items-center gap-3 font-bold text-sm">
              <Check className="w-5 h-5 text-emerald-600" /> Priority feed
              placement
            </li>
            <li className="flex items-center gap-3 font-bold text-sm">
              <Check className="w-5 h-5 text-emerald-600" /> No feedback rate
              limit
            </li>
          </ul>

          {!user ? (
            <Link
              href="/login"
              className="bg-black border-2 border-black text-white text-center font-black uppercase italic py-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all block"
            >
              Log in to Upgrade
            </Link>
          ) : isPro ? (
            <div className="bg-emerald-400 border-2 border-black text-center font-black uppercase italic py-4">
              Active Plan
            </div>
          ) : (
            <button
              disabled={loading}
              onClick={handleUpgrade}
              className="bg-black border-2 border-black text-white font-black uppercase italic py-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center w-full"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Upgrade via Paddle"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
