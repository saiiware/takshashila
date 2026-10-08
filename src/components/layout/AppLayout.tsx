import { useState, useEffect, type ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useAuth } from "@/context/AuthContext";

export default function AppLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Automatically close sidebar drawer when user navigates to a new page
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      {/* Sidebar with Hamburger-controlled Drawer on Mobile */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header / App Bar with Hamburger */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/80 bg-white/90 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile / Drawer */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isSidebarOpen}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink/80 shadow-2xs hover:bg-workshop-50 hover:text-workshop-700 transition-colors md:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Platform Branding on Mobile Header */}
            <div className="flex items-center gap-2 md:hidden">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-workshop-600 text-white font-extrabold text-xs shadow-2xs">
                T
              </span>
              <span className="font-extrabold text-workshop-700 text-lg">Takshashila</span>
            </div>

            {/* Desktop Breadcrumb/Course Indicator */}
            <div className="hidden md:flex items-center gap-2 text-sm text-ink/60">
              <span className="font-semibold text-workshop-600">Course:</span>
              <span className="font-medium text-ink">Introduction to Knitting Craft</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Fast Ask AI Link */}
            <Link
              to="/ai-assistant"
              className="inline-flex items-center gap-1.5 rounded-full border border-workshop-200 bg-workshop-50/70 px-3 py-1.5 text-xs font-semibold text-workshop-800 hover:bg-workshop-100 hover:border-workshop-300 transition-all shadow-2xs active:scale-95"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ask AI Tutor</span>
            </Link>

            {/* Profile Avatar Shortcut */}
            <Link
              to="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-workshop-600 text-white font-bold text-xs shadow-2xs hover:bg-workshop-700 transition-colors"
              title="View Profile & Settings"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-20 md:pb-10">
          <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation for quick thumb navigation */}
      <MobileNav />
    </div>
  );
}
