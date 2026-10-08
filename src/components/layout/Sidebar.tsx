import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";
import { MOCK_COURSE } from "@/data/mockData";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    to: "/course",
    label: "My Course",
    badge: "10 Lessons",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    to: "/check-work",
    label: "Check My Work",
    badge: "Photo AI",
    isHighlight: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
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
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { completedCount, progressPercent, enrollment } = useProgress();

  const continueVideoId = enrollment?.lastAccessedVideoId ?? MOCK_COURSE.videos[0].id;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-xs transition-opacity md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-white transition-all duration-300 ease-in-out md:static ${
          /* Mobile styles */
          isOpen ? "translate-x-0 w-72 shadow-2xl" : "-translate-x-full md:translate-x-0"
        } ${
          /* Desktop collapsed vs expanded styles */
          isCollapsed ? "md:w-20" : "md:w-64"
        }`}
      >
        {/* Brand & Left Column Header with Hamburger Toggle */}
        <div className={`flex items-center border-b border-line p-4 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-workshop-600 text-white font-extrabold text-base shadow-xs">
                T
              </span>
              <div className="min-w-0">
                <p className="text-xl font-extrabold tracking-tight text-workshop-700 leading-tight">
                  Takshashila
                </p>
                <p className="text-[11px] font-medium text-ink/50 truncate">
                  Craft Skills Platform
                </p>
              </div>
            </div>
          ) : (
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-workshop-600 text-white font-extrabold text-lg shadow-xs cursor-pointer hover:bg-workshop-700 transition-colors"
              onClick={onToggleCollapse}
              title="Expand sidebar"
            >
              T
            </span>
          )}

          {/* Desktop Collapse / Hamburger Toggle inside Sidebar */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink/60 hover:bg-workshop-50 hover:text-workshop-700 hover:border-workshop-300 transition-colors ${
                isCollapsed ? "mt-2" : ""
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>
          )}

          {/* Close button for Mobile Drawer */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink/60 hover:bg-workshop-50 hover:text-ink md:hidden transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          {!isCollapsed && (
            <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-ink/40">
              Menu
            </p>
          )}

          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `group flex items-center rounded-xl transition-all ${
                  isCollapsed ? "justify-center p-3" : "justify-between px-3.5 py-2.5 text-base"
                } ${
                  isActive
                    ? "bg-workshop-600 text-white shadow-xs font-bold"
                    : "text-ink/80 hover:bg-workshop-50 hover:text-workshop-700 font-semibold"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                    <span
                      className={`transition-colors ${
                        isActive ? "text-white" : "text-ink/50 group-hover:text-workshop-600"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        isActive
                          ? "bg-white/20 text-white"
                          : item.isHighlight
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
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

          {/* Course Progress Widget */}
          {!isCollapsed ? (
            <div className="pt-4">
              <div className="rounded-2xl border border-workshop-200 bg-gradient-to-br from-workshop-50/80 to-white p-3.5 text-left shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-workshop-700">
                    Knitting Course
                  </span>
                  <span className="text-xs font-extrabold text-workshop-700">
                    {progressPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-workshop-100 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-workshop-600 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p className="text-xs text-ink/70 mb-2.5">
                  {completedCount} of {MOCK_COURSE.totalVideos} lessons completed
                </p>

                <Link
                  to={`/course/video/${continueVideoId}`}
                  onClick={onClose}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-workshop-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-workshop-700 transition-colors"
                >
                  <span>Continue Lesson</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Collapsed mini progress indicator */
            <div className="pt-3 flex flex-col items-center">
              <Link
                to={`/course/video/${continueVideoId}`}
                title={`Progress: ${progressPercent}% (${completedCount}/${MOCK_COURSE.totalVideos}) - Click to resume`}
                className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-workshop-100 text-workshop-800 border border-workshop-200 hover:bg-workshop-200 transition-all"
              >
                <span className="text-[10px] font-extrabold">{progressPercent}%</span>
                <span className="text-[8px] text-workshop-600 font-bold">DONE</span>
              </Link>
            </div>
          )}
        </nav>

        {/* User Card Footer */}
        <div className="border-t border-line p-3 bg-paper/40">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} gap-2`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-workshop-600 text-white text-sm font-bold shadow-2xs"
                title={user?.name || "Learner"}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{user?.name || "Learner"}</p>
                  <p className="truncate text-xs text-ink/50">{user?.contact || "Student"}</p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                type="button"
                onClick={logout}
                title="Log out"
                aria-label="Log out"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-ink/60 hover:bg-clay-50 hover:text-clay-600 hover:border-clay-300 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
