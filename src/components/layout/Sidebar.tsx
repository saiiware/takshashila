import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/course", label: "My Course", icon: "📚" },
  { to: "/learning", label: "Learning", icon: "▶️" },
  { to: "/ai-assistant", label: "AI Assistant", icon: "🤖" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-white md:flex">
      <div className="border-b border-line p-5">
        <p className="text-xl font-extrabold text-workshop-500">Takshashila</p>
        <p className="text-sm text-ink/50">Learn a skill, at your pace</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-card px-4 py-3 text-lg font-medium transition-colors ${
                isActive
                  ? "bg-workshop-500 text-white"
                  : "text-ink hover:bg-workshop-50"
              }`
            }
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line p-4">
        <p className="truncate text-base font-medium text-ink">{user?.name}</p>
        <button
          onClick={logout}
          className="mt-2 text-base font-medium text-clay-500 hover:underline"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
