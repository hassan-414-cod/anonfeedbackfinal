"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Upload, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Avatar from "./Avatar";
import Logo from "./Logo";

const LINKS = [
  { href: "/feed", label: "Feed" },
  { href: "/projects", label: "Dashboard" },
  { href: "/rooms", label: "Rooms" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/about", label: "How it works" },
];

export default function Navbar() {
  const { user, userProfile, logout, openAuth, loading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 bg-ink/80 backdrop-blur-xl border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8 min-w-0">
          <Logo />
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive(l.href)
                    ? "text-acid bg-acid/10"
                    : "text-fog hover:text-paper hover:bg-panel-2"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/projects?tab=new" className="btn btn-acid hidden sm:inline-flex">
            <Upload className="w-4 h-4" /> Upload
          </Link>

          {user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-panel-2"
                aria-label="Your profile"
              >
                <Avatar handle={userProfile?.anonymous_handle} size={32} />
                <div className="hidden md:block leading-tight">
                  <div className="mono text-[9px] uppercase tracking-widest text-fog">
                    You are
                  </div>
                  <div className="text-sm font-bold">
                    {userProfile?.anonymous_handle || "…"}
                  </div>
                </div>
              </Link>
              <button
                onClick={logout}
                aria-label="Log out"
                className="hidden sm:inline-flex text-fog hover:text-paper p-2 rounded-lg hover:bg-panel-2"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            !loading && (
              <>
                <button
                  onClick={() => openAuth("login")}
                  className="hidden sm:inline-flex btn btn-ghost"
                >
                  Log in
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="btn bg-ghost text-white hover:brightness-110"
                >
                  Join
                </button>
              </>
            )
          )}

          <button
            className="lg:hidden p-2 rounded-lg text-paper hover:bg-panel-2"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-line bg-ink fade-up">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col" aria-label="Mobile">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-3 rounded-lg font-semibold ${isActive(l.href) ? "text-acid" : "text-paper"}`}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/projects?tab=new" className="px-3 py-3 rounded-lg font-semibold text-acid">
              + Upload project
            </Link>
            {user ? (
              <>
                <Link href="/profile" className="px-3 py-3 rounded-lg font-semibold">
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-3 rounded-lg font-semibold text-left text-alert"
                >
                  Log out
                </button>
              </>
            ) : (
              <button
                onClick={() => openAuth("login")}
                className="px-3 py-3 rounded-lg font-semibold text-left"
              >
                Log in
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
