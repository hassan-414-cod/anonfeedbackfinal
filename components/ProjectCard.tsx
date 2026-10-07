import Link from "next/link";
import { ArrowBigUp, MessageSquare } from "lucide-react";
import { categoryTone, colorsFor, timeAgo } from "@/lib/helpers";
import Avatar from "./Avatar";

export function ProjectCover({
  project,
  className = "",
}: {
  project: any;
  className?: string;
}) {
  const img =
    project.cover_image_url ||
    (project.file_type?.startsWith("image/") ? project.file_url : "");
  const [a, b] = colorsFor(project.id || project.title || "x");
  return (
    <div className={`relative overflow-hidden bg-panel-2 ${className}`}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={project.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full flex items-end p-4"
          style={{ background: `linear-gradient(135deg, ${a}33, ${b}55)` }}
        >
          <span className="mono text-[10px] uppercase tracking-widest text-paper/70">
            {project.type || "project"} · no preview
          </span>
        </div>
      )}
    </div>
  );
}

export default function ProjectCard({ project }: { project: any }) {
  return (
    <Link
      href={`/project/${project.id}`}
      className="group card overflow-hidden flex flex-col hover:border-acid/60 hover:-translate-y-0.5 transition-all"
    >
      <ProjectCover project={project} className="h-44" />
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border ${categoryTone(project.category)}`}
          >
            {project.category || "Other"}
          </span>
          <span className="mono text-[10px] text-fog">
            {timeAgo(project.created_at)}
          </span>
        </div>
        <h3 className="text-lg font-bold leading-snug line-clamp-1 group-hover:text-acid transition-colors">
          {project.title}
        </h3>
        <p className="text-sm text-fog line-clamp-2 mt-1 flex-grow">
          {project.description}
        </p>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar handle={project.owner_handle} size={22} />
            <span className="mono text-xs text-fog truncate">
              {project.owner_handle}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-fog shrink-0">
            <span className="flex items-center gap-1 text-acid">
              <ArrowBigUp className="w-4 h-4" /> {project.upvotes || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> {project.feedback_count || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
