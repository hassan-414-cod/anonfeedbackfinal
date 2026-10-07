"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  return (
    <div className="flex flex-col flex-grow items-center px-4 py-16 w-full">
      <div className="w-full max-w-md card p-6 sm:p-10">
        <div className="chip mb-4"><span className="live-dot" /> identity generator</div>
        <h1 className="text-3xl font-black tracking-tight mb-1">Put on the mask.</h1>
        <p className="text-fog text-sm mb-6">
          We need an email to prevent spam, but it&apos;s never shown. You&apos;ll get a random handle.
        </p>
        <AuthForm mode="signup" onModeChange={() => router.push("/login")} onDone={() => router.push("/")} />
      </div>
    </div>
  );
}
