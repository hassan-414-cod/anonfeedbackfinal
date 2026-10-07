"use client";
import Image from "next/image";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const DUMMY_PROJECTS = [
  {
    id: "dummy-1",
    title: "Forest Journal",
    description:
      "A minimal, nature-inspired journaling app that helps you reflect and grow daily.",
    category: "Web App",
    owner_handle: "Hassan Mahmud",
    cover_image_url:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    upvotes: 120,
  },
  {
    id: "dummy-2",
    title: "Your AI Assistant",
    description:
      "An AI agent that helps you ship faster by writing code and automating workflows.",
    category: "AI Agent",
    owner_handle: "Alex Chen",
    cover_image_url:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    upvotes: 95,
  },
  {
    id: "dummy-3",
    title: "Track habits, build momentum.",
    description:
      "A dark-themed mobile app designed for habit tracking with detailed analytics.",
    category: "Mobile App",
    owner_handle: "Jamie Park",
    cover_image_url:
      "https://images.unsplash.com/photo-1616469829581-73993eb86b02?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    upvotes: 310,
  },
];

export default function FeedPage() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState("newest");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categoriesList = [
    "All",
    "AI Agent",
    "Web App",
    "Software",
    "Website",
    "Mobile App",
    "Design",
    "Code",
    "Other",
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Web App": "bg-[#E6F0FE] text-blue-800",
      "Mobile App": "bg-[#F3E8FF] text-purple-800",
      Website: "bg-[#FCE7F3] text-pink-800",
      Software: "bg-[#F1F5F9] text-slate-800",
      "AI Agent": "bg-[#E6F8F0] text-emerald-800",
      Design: "bg-[#FEF3C7] text-amber-800",
      Code: "bg-[#FFEDD5] text-orange-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const filteredProjects = DUMMY_PROJECTS.filter((p) => {
    const matchesCategory =
      activeCategory === "All" || p.category === activeCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto flex-grow flex flex-col p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pt-4">
        <div>
          <h2 className="text-3xl font-bold text-black tracking-tight mb-1 uppercase">
            FEED
          </h2>
          <p className="text-gray-500 font-medium">
            Top recommended projects around the globe.
          </p>
        </div>
        <div className="flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm">
          <button
            onClick={() => setSortBy("newest")}
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${sortBy === "newest" ? "bg-black text-white" : "bg-white text-gray-500 hover:text-black"}`}
          >
            NEWEST
          </button>
          <button
            onClick={() => setSortBy("upvoted")}
            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${sortBy === "upvoted" ? "bg-black text-white" : "bg-white text-gray-500 hover:text-black"}`}
          >
            POPULAR
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-10">
        <div className="relative flex-grow lg:max-w-sm xl:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search projects, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-50 transition-all font-medium text-sm shadow-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center flex-1">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-all border ${
                activeCategory === cat
                  ? "bg-[#FDD85D] border-transparent text-black shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:text-black hover:bg-gray-50 shadow-sm"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-3xl border-dashed">
          <h3 className="text-lg font-bold mb-2 text-gray-900">
            No projects found
          </h3>
          <p className="font-medium text-gray-500">
            Try adjusting your filters or search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {filteredProjects.map((proj) => (
            <Link
              href={`/project/${proj.id}`}
              key={proj.id}
              className="group bg-white rounded-2xl border border-gray-100 p-6 flex flex-col hover:shadow-xl hover:border-gray-200 transition-all shadow-sm"
            >
              <div className="flex justify-between items-start mb-6">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-md ${getCategoryColor(proj.category)}`}
                >
                  {proj.category}
                </span>
                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md">
                  {proj.owner_handle}
                </span>
              </div>

              <div className="w-full h-48 bg-gray-50 rounded-xl mb-6 relative overflow-hidden group-hover:opacity-90 transition-opacity flex items-center justify-center border border-gray-100">
                {proj.cover_image_url ? (
                  <Image
                    src={proj.cover_image_url}
                    className="w-full h-full object-cover"
                    alt={proj.title}
                    fill
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-gray-400 font-medium text-sm">
                    No Preview Image
                  </div>
                )}
              </div>

              <div className="flex-grow">
                <h3 className="text-xl font-bold leading-tight line-clamp-1 mb-2 text-gray-900">
                  {proj.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 font-medium">
                  {proj.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
