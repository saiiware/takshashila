import { useState, useEffect, type ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useAuth } from "@/context/AuthContext";

export default function AppLayout({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => {
    try {
      return localStorage.getItem("takshashila_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const location = useLocation();
  const { user } = useAuth();

  // Automatically close mobile sidebar drawer when user navigates
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsDesktopCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("takshashila_sidebar_collapsed", String(next));
        } catch {
          // ignore storage error
        }
        return next;
      });
    }
  };

  const handleToggleDesktop = () => {
    setIsDesktopCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("takshashila_sidebar_collapsed", String(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      {/* Left Column Sidebar (Collapsible & Responsive) */}
      <Sidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        isCollapsed={isDesktopCollapsed}
        onToggleCollapse={handleToggleDesktop}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 transition-all duration-300">
        {/* Top Header / App Bar with Universal Hamburger Button */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/80 bg-white/95 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Left Column (Visible on Desktop, Tablet & Mobile) */}
            <button
              type="button"
              onClick={handleToggleSidebar}
              aria-label={
                isDesktopCollapsed
                  ? "Expand left column navigation"
                  : "Toggle left column navigation"
              }
              title={
                isDesktopCollapsed
                  ? "Expand left navigation (Hamburger)"
                  : "Collapse left navigation (Hamburger)"
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink/80 shadow-2xs hover:bg-workshop-50 hover:text-workshop-700 hover:border-workshop-300 transition-all active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Platform Branding */}
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-workshop-600 text-white font-extrabold text-xs shadow-2xs">
                T
              </span>
              <span className="font-extrabold text-workshop-700 text-lg tracking-tight">
                Takshashila
              </span>
            </div>

            {/* Desktop Breadcrumb/Course Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-ink/60 border-l border-line pl-3 ml-1">
              <span className="font-semibold text-workshop-600">Course:</span>
              <span className="font-medium text-ink">Knitting Craft & Handloom Essentials</span>
            </div>
          </div>

          {/* Right Header Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Check Work Photo Upload Quick Action Button */}
            <Link
              to="/check-work"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/90 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 hover:border-amber-400 transition-all shadow-2xs active:scale-95"
              title="Upload photo of your work to check against videos"
            >
              <span>📸</span>
              <span className="hidden sm:inline">Check My Work</span>
            </Link>

            {/* Fast Ask AI Link */}
            <Link
              to="/ai-assistant"
              className="inline-flex items-center gap-1.5 rounded-full border border-workshop-200 bg-workshop-50/80 px-3 py-1.5 text-xs font-semibold text-workshop-800 hover:bg-workshop-100 hover:border-workshop-300 transition-all shadow-2xs active:scale-95"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Ask AI Tutor</span>
              <span className="sm:hidden">AI Tutor</span>
            </Link>

            {/* Profile Avatar Shortcut */}
            <Link
              to="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-workshop-600 text-white font-bold text-xs shadow-2xs hover:bg-workshop-700 transition-colors"
              title="View Profile & Settings"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-20 md:pb-10">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation for quick thumb navigation */}
      <MobileNav />
    </div>
  );
}
