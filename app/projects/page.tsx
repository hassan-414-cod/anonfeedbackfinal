"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  PlusCircle,
  MessageSquare,
  Clock,
  Folder,
  Link as LinkIcon,
  FileText,
  Code,
  CheckCircle,
  Video,
  Image as ImageIcon,
  Upload,
  ArrowRight,
} from "lucide-react";

function ProjectsContent() {
  const [activeTab, setActiveTab] = useState("my-projects");
  const [newProjectType, setNewProjectType] = useState("link");
  const searchParams = useSearchParams();

  // Basic search params sync to handle ?tab=new etc. from home page
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      if (tab === "new") {
        setTimeout(() => setActiveTab("new-project"), 0);
      } else if (tab === "chat") {
        setTimeout(() => setActiveTab("chat-rooms"), 0);
      } else {
        setTimeout(() => setActiveTab(tab), 0);
      }
    }
  }, [searchParams]);

  const TABS = [
    { id: "my-projects", label: "My Projects", icon: Folder },
    { id: "new-project", label: "New Project", icon: PlusCircle },
    { id: "history", label: "History", icon: Clock },
    { id: "chat-rooms", label: "Chat Rooms", icon: MessageSquare },
  ];

  const PROJECT_TYPES = [
    { id: "link", label: "Website Link", icon: LinkIcon },
    { id: "doc", label: "Document", icon: FileText },
    { id: "code", label: "Code Snippet", icon: Code },
    { id: "image", label: "Image / Design", icon: ImageIcon },
    { id: "video", label: "Video Demo", icon: Video },
  ];

  return (
    <div className="flex flex-grow w-full max-w-7xl mx-auto h-[calc(100vh-80px)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col py-6 shrink-0 h-full overflow-y-auto hidden md:flex">
        <div className="px-6 mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Dashboard
          </h2>
        </div>
        <nav className="flex-grow space-y-1 px-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-white text-black shadow-sm border border-gray-200"
                    : "text-gray-500 hover:text-black hover:bg-gray-100 border border-transparent"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-indigo-500" : "text-gray-400"}`}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col bg-white overflow-y-auto p-6 md:p-10">
        {/* Mobile Tab Selector */}
        <div className="md:hidden flex overflow-x-auto space-x-2 pb-4 mb-6 border-b border-gray-100 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === tab.id
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Views */}

        {activeTab === "my-projects" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-bold text-black uppercase tracking-tight">
                  My Projects
                </h1>
                <p className="text-gray-500 font-medium mt-1">
                  Manage and view feedback for your uploaded projects.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("new-project")}
                className="hidden sm:inline-flex items-center px-4 py-2 bg-[#FF5A5F] text-white text-sm font-bold rounded-lg hover:bg-[#ff6e72] transition-colors"
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Upload New
              </button>
            </div>

            {/* Dummy List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col"
                >
                  <div className="w-full h-32 bg-gray-100 rounded-xl mb-4 flex items-center justify-center">
                    <span className="text-gray-400 font-medium text-xs">
                      Preview
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">
                    My awesome project {i}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium mb-4 line-clamp-2">
                    This is a short description of the project that I uploaded.
                  </p>
                  <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-xs font-bold text-indigo-500">
                      12 Reviews
                    </span>
                    <span className="text-xs font-medium text-gray-400">
                      2 days ago
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "new-project" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-3xl">
            <h1 className="text-3xl font-bold text-black uppercase tracking-tight mb-2">
              Upload New Project
            </h1>
            <p className="text-gray-500 font-medium mb-8">
              Select the type of project you want to get feedback on.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
              {PROJECT_TYPES.map((pt) => {
                const TypeIcon = pt.icon;
                const isSelected = newProjectType === pt.id;
                return (
                  <button
                    key={pt.id}
                    onClick={() => setNewProjectType(pt.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-[#FF5A5F] bg-red-50 text-[#FF5A5F]"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <TypeIcon
                      className={`w-6 h-6 ${isSelected ? "text-[#FF5A5F]" : "text-gray-400"}`}
                    />
                    <span className="text-xs font-bold text-center">
                      {pt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <form className="space-y-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-700">
                  Project Title
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-50 transition-all font-medium"
                  placeholder="E.g. New Landing Page Design"
                />
              </div>

              {/* Dynamic Type Field */}
              {newProjectType === "link" && (
                <div className="space-y-1.5 animate-in fade-in duration-300">
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-700">
                    Website URL
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      required
                      type="url"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-50 transition-all font-medium"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}

              {newProjectType === "code" && (
                <div className="space-y-1.5 animate-in fade-in duration-300">
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-700">
                    Code Snippet (Markdown allowed)
                  </label>
                  <textarea
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-50 transition-all font-mono text-sm"
                    placeholder="Paste your code here..."
                  />
                </div>
              )}

              {(newProjectType === "doc" ||
                newProjectType === "image" ||
                newProjectType === "video") && (
                <div className="space-y-1.5 animate-in fade-in duration-300">
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-700">
                    Upload File
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mb-3" />
                    <span className="text-sm font-bold text-gray-600">
                      Click to upload or drag & drop
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Supports PDF, JPG, PNG, MP4
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-700">
                  Description / What do you want feedback on?
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-50 transition-all font-medium"
                  placeholder="I'm unsure about the color scheme and the copy on the hero section..."
                />
              </div>

              <button
                type="button"
                className="w-full sm:w-auto px-8 py-3 bg-[#FDD85D] text-black font-bold rounded-xl hover:bg-[#FCE081] transition-colors shadow-sm"
              >
                Submit Project
              </button>
            </form>
          </div>
        )}

        {activeTab === "history" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h1 className="text-3xl font-bold text-black uppercase tracking-tight mb-2">
              History
            </h1>
            <p className="text-gray-500 font-medium mb-8">
              Projects you have reviewed or interacted with.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-3xl border-dashed py-20 text-center">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                Your history will appear here once you start reviewing.
              </p>
            </div>
          </div>
        )}

        {activeTab === "chat-rooms" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-bold text-black uppercase tracking-tight">
                  Chat Rooms
                </h1>
                <p className="text-gray-500 font-medium mt-1">
                  Join anonymous discussions with other builders.
                </p>
              </div>
              <button className="hidden sm:inline-flex items-center px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors">
                <PlusCircle className="w-4 h-4 mr-2" /> Create Room
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Startup Ideas Validation",
                "Code Review & Architecture",
                "Design Roast (Brutal)",
                "General Chat",
              ].map((room, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-[#FDD85D] group-hover:text-black transition-colors">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{room}</h3>
                      <p className="text-xs font-medium text-gray-500">
                        {12 + i * 3} people active
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
