import { Link } from "react-router-dom";
import type { Video } from "@/types";

interface VideoListItemProps {
  video: Video;
  status: "completed" | "current" | "upcoming" | "locked";
}

const statusConfig: Record<
  VideoListItemProps["status"],
  { badge: string; badgeClass: string }
> = {
  completed: { badge: "Completed", badgeClass: "bg-sprout-100 text-sprout-600" },
  current: { badge: "Continue", badgeClass: "bg-turmeric-100 text-turmeric-600" },
  upcoming: { badge: "Up next", badgeClass: "bg-workshop-50 text-workshop-500" },
  locked: { badge: "Locked", badgeClass: "bg-ink/5 text-ink/40" },
};

export default function VideoListItem({ video, status }: VideoListItemProps) {
  const { badge, badgeClass } = statusConfig[status];
  const isLocked = status === "locked";

  const content = (
    <div
      className={`flex items-center gap-4 rounded-card border border-line bg-white p-4 transition-colors ${
        isLocked ? "opacity-60" : "hover:border-workshop-400"
      }`}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
        style={{ backgroundColor: video.thumbnailColor }}
      >
        {status === "completed" ? "✓" : video.order}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold text-ink">{video.title}</p>
        <p className="text-base text-ink/60">{video.durationMinutes} min</p>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${badgeClass}`}>
        {badge}
      </span>
    </div>
  );

  if (isLocked) {
    return <div aria-disabled="true">{content}</div>;
  }

  return (
    <Link to={`/course/video/${video.id}`} className="block">
      {content}
    </Link>
  );
}
