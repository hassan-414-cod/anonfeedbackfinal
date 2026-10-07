"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Upload,
  MessageSquare,
  PlusCircle,
  Link as LinkIcon,
  Users,
  FileText,
  ArrowRight,
  Shield,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { user } = useAuth();

  // Real-time counter dummies
  const [activeUsers, setActiveUsers] = useState(1243);
  const [totalProjects, setTotalProjects] = useState(892);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers((prev) => prev + Math.floor(Math.random() * 3) - 1); // fluctuates slightly
      if (Math.random() > 0.7) {
        setTotalProjects((prev) => prev + 1); // increments occasionally
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto flex-grow flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Hero Section */}
      <div className="bg-[#FFF8E7] rounded-3xl p-8 sm:p-14 mb-12 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-[#FEEB9D] text-black px-4 py-1.5 rounded-full text-xs font-bold mb-6">
            <Shield className="w-4 h-4" /> WHAT WE DO
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-black leading-[1.05] tracking-tight mb-6 uppercase">
            THE ANONYMOUS
            <br />
            FEEDBACK ENGINE.
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl mb-10 max-w-xl font-medium leading-relaxed">
            Upload your projects, share links, and join chat rooms entirely
            anonymously. Get the brutal truth and real insights without the
            clout chasing.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/projects?tab=new"
              className="inline-flex items-center justify-center bg-[#FF5A5F] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#ff6e72] transition-colors shadow-sm text-sm tracking-wide uppercase"
            >
              UPLOAD NOW <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <button className="inline-flex items-center justify-center bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm tracking-wide border border-gray-200 uppercase">
              INVITE A FRIEND
            </button>
          </div>
        </div>

        {/* Live Stats Mini Cards (Inside Hero, Top Right) */}
        <div className="absolute top-8 right-8 z-20 hidden lg:flex flex-col gap-3">
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-3 pr-6 shadow-sm border border-white/50 flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <div className="text-xl font-black text-black leading-none mb-0.5">
                {activeUsers.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Active Users
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-3 pr-6 shadow-sm border border-white/50 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-xl font-black text-black leading-none mb-0.5">
                {totalProjects.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Projects Uploaded
              </div>
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-2/3 opacity-40 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 bg-[#FDD85D] rounded-full blur-3xl translate-x-1/3"></div>
        </div>
      </div>

      {/* Action Cards Grid */}
      <h2 className="text-2xl font-bold text-black tracking-tight mb-6 uppercase">
        Platform Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-12">
        {/* Card 1: Upload Projects */}
        <Link
          href="/projects?tab=new"
          className="group bg-white rounded-2xl border border-gray-100 p-6 flex flex-col hover:shadow-xl hover:border-gray-200 transition-all shadow-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Upload Project
          </h3>
          <p className="text-sm text-gray-500 font-medium mb-4 flex-grow">
            Upload your files securely for peer review and structured critique.
          </p>
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center">
            Go to upload <ArrowRight className="ml-1 w-3 h-3" />
          </div>
        </Link>

        {/* Card 2: Drop a Link */}
        <Link
          href="/projects?tab=new&type=link"
          className="group bg-white rounded-2xl border border-gray-100 p-6 flex flex-col hover:shadow-xl hover:border-gray-200 transition-all shadow-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <LinkIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Drop a Link</h3>
          <p className="text-sm text-gray-500 font-medium mb-4 flex-grow">
            Have a live site? Drop the URL directly and start getting instant
            feedback.
          </p>
          <div className="text-xs font-bold text-pink-600 uppercase tracking-wider flex items-center">
            Share URL <ArrowRight className="ml-1 w-3 h-3" />
          </div>
        </Link>

        {/* Card 3: Enter Chat Room */}
        <Link
          href="/projects?tab=chat"
          className="group bg-white rounded-2xl border border-gray-100 p-6 flex flex-col hover:shadow-xl hover:border-gray-200 transition-all shadow-sm cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Enter Chat Room
          </h3>
          <p className="text-sm text-gray-500 font-medium mb-4 flex-grow">
            Join an active anonymous discussion room to talk about tech, design,
            or ideas.
          </p>
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center">
            Join Chat <ArrowRight className="ml-1 w-3 h-3" />
          </div>
        </Link>

        {/* Card 4: Create Chat Room */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Create Chat Room
          </h3>
          <p className="text-sm text-gray-500 font-medium mb-4">
            Start your own anonymous room.
          </p>

          <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 mb-4 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all">
            <option>Design Feedback</option>
            <option>Code Review</option>
            <option>Startup Ideas</option>
            <option>General Chat</option>
          </select>

          <Link
            href="/projects?tab=chat"
            className="w-full bg-black text-white font-bold text-center rounded-lg py-2.5 text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors mt-auto"
          >
            Create Room
          </Link>
        </div>
      </div>
    </div>
  );
}
