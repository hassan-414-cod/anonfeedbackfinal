"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { LogOut, Upload } from "lucide-react";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const { user, userProfile, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  href="/"
                  className="text-2xl font-bold tracking-tight text-black hover:opacity-80"
                >
                  ANON-FEEDBACK
                </Link>
              </div>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-8 items-center text-sm font-medium text-gray-500 uppercase tracking-wide">
                <Link href="/feed" className="hover:text-black">
                  Feed
                </Link>
                <Link href="/projects" className="hover:text-black">
                  Projects
                </Link>
                <Link href="/leaderboard" className="hover:text-black">
                  Leaderboard
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <Link
                href="/projects?tab=new"
                className="inline-flex items-center px-4 py-2.5 text-sm font-bold bg-[#FDD85D] text-black rounded-lg hover:bg-[#FCE081] transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" /> UPLOAD PROJECT
              </Link>

              {user ? (
                <>
                  <div className="flex items-center space-x-4 border-l border-gray-200 pl-6 ml-2">
                    <Link href="/profile" className="flex items-center group">
                      <div className="text-right mr-3 hidden sm:block">
                        <div className="text-[10px] font-medium uppercase text-gray-400">
                          Identity
                        </div>
                        <div className="text-sm font-medium text-black">
                          {userProfile?.anonymous_handle || "Loading..."}
                        </div>
                      </div>
                      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 transition-all group-hover:bg-gray-200">
                        {userProfile?.anonymous_handle?.[0] || "?"}
                      </div>
                    </Link>
                    <button
                      onClick={logout}
                      className="text-gray-400 hover:text-gray-900 p-2 rounded-full transition-all hover:bg-gray-100"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="hidden sm:inline-flex items-center px-5 py-2.5 text-sm font-bold bg-[#FF5A5F] text-white rounded-lg hover:bg-[#ff6e72] transition-colors"
                  >
                    JOIN ANONYMOUSLY
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
