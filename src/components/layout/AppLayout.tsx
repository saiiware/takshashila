import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
