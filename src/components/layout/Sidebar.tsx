import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";
import { MOCK_COURSE } from "@/data/mockData";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onLessonSelect?: () => void;
}

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: "/course",
    label: "My Course",
    badge: "6 Lessons",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    to: "/ai-assistant",
    label: "AI Assistant",
    badge: "Vision + RAG",
    isAi: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: "/profile",
    label: "Profile & Settings",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function Sidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  onLessonSelect,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { completedCount, progressPercent, enrollment } = useProgress();
  const location = useLocation();
  const [areLessonsOpen, setAreLessonsOpen] = useState(true);

  const continueVideoId = enrollment?.lastAccessedVideoId ?? MOCK_COURSE.videos[0].id;

  const handleLessonLinkClick = () => {
    if (onLessonSelect) onLessonSelect();
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-xs transition-opacity md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar: Sticky to top-0 and fixed height on desktop to prevent blank gaps when scrolling */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white transition-all duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:max-h-screen md:self-start shrink-0 ${
          isOpen
            ? "translate-x-0 w-72 shadow-2xl"
            : "-translate-x-full md:translate-x-0"
        } ${
          isCollapsed
            ? "md:w-0 md:opacity-0 md:overflow-hidden md:border-none md:p-0"
            : "md:w-72 md:opacity-100 border-r border-line shadow-xs md:shadow-none"
        }`}
      >
        <div className="w-72 flex flex-col h-full max-h-screen min-h-0 bg-white">
          {/* Brand Header with Collapse Toggle */}
          <div className="flex shrink-0 items-center justify-between border-b border-line p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-workshop-600 text-white font-extrabold text-base shadow-xs">
                T
              </span>
              <div>
                <p className="text-lg font-extrabold tracking-tight text-workshop-700 leading-tight">Takshashila</p>
                <p className="text-[11px] font-medium text-ink/50">Craft Skills Learning</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Close button for mobile drawer */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sidebar menu"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink/60 hover:bg-workshop-50 hover:text-ink md:hidden transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Collapse into hamburger button on desktop */}
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar into hamburger"
                title="Collapse sidebar into hamburger"
                className="hidden md:flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink/60 hover:bg-workshop-50 hover:text-workshop-700 transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation & Course Lessons List */}
          <nav className="flex-1 min-h-0 space-y-3 p-3 overflow-y-auto">
            {/* Main Navigation */}
            <div className="space-y-1">
              <p className="px-3 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-ink/40">
                Menu
              </p>
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-card px-3 py-2 text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-workshop-600 text-white shadow-xs"
                        : "text-ink/80 hover:bg-workshop-50 hover:text-workshop-700"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`transition-colors ${
                            isActive ? "text-white" : "text-ink/50 group-hover:text-workshop-600"
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                            isActive
                              ? "bg-white/20 text-white"
                              : item.isAi
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-workshop-100 text-workshop-800"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Course Lessons Section with Collapsible Small Arrow */}
            <div className="pt-2 border-t border-line/60">
              <button
                type="button"
                onClick={() => setAreLessonsOpen((prev) => !prev)}
                aria-expanded={areLessonsOpen}
                className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-workshop-50 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <svg
                    className={`h-3.5 w-3.5 text-workshop-600 transition-transform duration-200 shrink-0 ${
                      areLessonsOpen ? "rotate-90" : "rotate-0"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-workshop-700 group-hover:text-workshop-800 truncate">
                    Course Lessons
                  </span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-workshop-100 text-workshop-800 shrink-0">
                  {completedCount}/{MOCK_COURSE.totalVideos} Done
                </span>
              </button>

              {areLessonsOpen && (
                <div className="space-y-1 mt-1.5">
                  {MOCK_COURSE.videos.map((vid) => {
                    const isVideoCompleted = Boolean(enrollment?.videoProgress[vid.id]?.completed);
                    const isVideoActive = location.pathname === `/course/video/${vid.id}`;

                    return (
                      <Link
                        key={vid.id}
                        to={`/course/video/${vid.id}`}
                        onClick={handleLessonLinkClick}
                        className={`group flex items-center justify-between rounded-card px-2.5 py-2 text-xs font-semibold transition-all ${
                          isVideoActive
                            ? "bg-workshop-600 text-white shadow-xs"
                            : "text-ink/80 hover:bg-workshop-50 hover:text-workshop-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                              isVideoCompleted
                                ? isVideoActive
                                  ? "bg-emerald-500 text-white"
                                  : "bg-emerald-100 text-emerald-800"
                                : isVideoActive
                                ? "bg-white/20 text-white"
                                : "bg-paper text-ink/70"
                            }`}
                          >
                            {isVideoCompleted ? "✓" : vid.order === 0 ? "★" : vid.order}
                          </span>
                          <p className="truncate text-xs font-semibold">
                            {vid.title}
                          </p>
                        </div>

                        <span
                          className={`text-[10px] font-medium shrink-0 ml-1.5 ${
                            isVideoActive ? "text-white/80" : "text-ink/40"
                          }`}
                        >
                          {vid.durationMinutes}m
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Course Progress Mini-Widget */}
            <div className="pt-2">
              <div className="rounded-card border border-workshop-200 bg-gradient-to-br from-workshop-50/70 to-white p-3 text-left shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-workshop-700">
                    Knitting Course
                  </span>
                  <span className="text-xs font-extrabold text-workshop-700">
                    {progressPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-workshop-100 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-workshop-600 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p className="text-[11px] text-ink/70 mb-2">
                  {completedCount} of {MOCK_COURSE.totalVideos} lessons completed
                </p>

                <Link
                  to={`/course/video/${continueVideoId}`}
                  onClick={handleLessonLinkClick}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-workshop-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-workshop-700 transition-colors"
                >
                  <span>Continue Learning</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </nav>

          {/* User Card Footer - Always anchored at the bottom */}
          <div className="shrink-0 border-t border-line p-3 bg-paper/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-workshop-600 text-white text-xs font-bold shadow-2xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-ink">{user?.name || "Learner"}</p>
                  <p className="truncate text-[10px] text-ink/50">{user?.contact || "Student"}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Log out"
                aria-label="Log out"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-ink/60 hover:bg-clay-50 hover:text-clay-600 hover:border-clay-300 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
