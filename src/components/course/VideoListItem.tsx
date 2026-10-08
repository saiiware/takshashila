import { Link } from "react-router-dom";
import type { Video } from "@/types";

interface VideoListItemProps {
  video: Video;
  status: "completed" | "current" | "upcoming" | "locked";
}

const statusConfig: Record<
  VideoListItemProps["status"],
  { badge: string; badgeClass: string; isInteractive: boolean }
> = {
  completed: {
    badge: "Completed",
    badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    isInteractive: true,
  },
  current: {
    badge: "In Progress",
    badgeClass: "bg-turmeric-100 text-turmeric-700 font-bold border border-turmeric-300 animate-pulse",
    isInteractive: true,
  },
  upcoming: {
    badge: "",
    badgeClass: "",
    isInteractive: true,
  },
  locked: {
    badge: "",
    badgeClass: "",
    isInteractive: true,
  },
};

export default function VideoListItem({ video, status }: VideoListItemProps) {
  const { badge, badgeClass, isInteractive } = statusConfig[status];
  const isCurrent = status === "current";
  const isCompleted = status === "completed";

  const content = (
    <div
      className={`group relative flex items-center justify-between gap-4 rounded-card border p-4 transition-all ${
        isCurrent
          ? "border-workshop-500 bg-white shadow-sm ring-1 ring-workshop-500"
          : isCompleted
          ? "border-line bg-white/80 hover:border-workshop-300 hover:bg-white"
          : isInteractive
          ? "border-line bg-white hover:border-workshop-400 hover:shadow-xs"
          : "border-line/60 bg-paper/50 opacity-60 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Lesson Number or Completion Icon */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold shadow-2xs transition-transform group-hover:scale-105 ${
            isCompleted
              ? "bg-emerald-600 text-white"
              : isCurrent
              ? "bg-workshop-600 text-white"
              : "text-white"
          }`}
          style={{ backgroundColor: !isCompleted && !isCurrent ? video.thumbnailColor : undefined }}
        >
          {isCompleted ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          ) : isCurrent ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            video.order
          )}
        </div>

        {/* Lesson Title & Snippet */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-workshop-600">
              Lesson {video.order}
            </span>
            <span className="text-xs text-ink/40">•</span>
            <span className="flex items-center gap-1 text-xs text-ink/60">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {video.durationMinutes} min
            </span>
          </div>

          <p className="truncate text-base font-bold text-ink mt-0.5 group-hover:text-workshop-700 transition-colors">
            {video.title}
          </p>
          <p className="line-clamp-1 text-xs text-ink/60 mt-0.5">
            {video.description}
          </p>
        </div>
      </div>

      {/* Status Badge & Action */}
      <div className="flex shrink-0 items-center gap-2">
        {badge && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass}`}>
            {badge}
          </span>
        )}
        {isInteractive && (
          <span className="hidden sm:inline-flex text-workshop-500 text-sm font-semibold group-hover:translate-x-1 transition-transform">
            →
          </span>
        )}
      </div>
    </div>
  );

  if (!isInteractive) {
    return <div aria-disabled="true">{content}</div>;
  }

  return (
    <Link to={`/course/video/${video.id}`} className="block">
      {content}
    </Link>
  );
}
