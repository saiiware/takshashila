import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";
import { MOCK_COURSE } from "@/data/mockData";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
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

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { isEnrolled, completedCount, progressPercent, enrollment } = useProgress();

  const continueVideoId = enrollment?.lastAccessedVideoId ?? MOCK_COURSE.videos[0].id;

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

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-white transition-transform duration-300 ease-in-out md:static md:w-64 md:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:flex md:shadow-none"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-line p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-workshop-600 text-white font-extrabold text-base shadow-xs">
                T
              </span>
              <p className="text-xl font-extrabold tracking-tight text-workshop-700">Takshashila</p>
            </div>
            <p className="text-xs font-medium text-ink/50 mt-1">Craft Skills Learning Platform</p>
          </div>

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
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-ink/40">
            Navigation
          </p>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-card px-3.5 py-2.5 text-base font-semibold transition-all ${
                  isActive
                    ? "bg-workshop-600 text-white shadow-xs"
                    : "text-ink/80 hover:bg-workshop-50 hover:text-workshop-700"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
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

          {/* Course Progress Mini-Widget */}
          <div className="pt-4">
            <div className="rounded-card border border-workshop-200 bg-gradient-to-br from-workshop-50/70 to-white p-3.5 text-left shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-workshop-700">
                  Knitting Course
                </span>
                <span className="text-xs font-extrabold text-workshop-700">
                  {progressPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-workshop-100 overflow-hidden mb-2.5">
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
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-workshop-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-workshop-700 transition-colors"
              >
                <span>Continue Learning</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* User Card Footer */}
        <div className="border-t border-line p-3.5 bg-paper/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-workshop-600 text-white text-sm font-bold shadow-2xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{user?.name || "Learner"}</p>
                <p className="truncate text-xs text-ink/50">{user?.contact || "Student"}</p>
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
      </aside>
    </>
  );
}
