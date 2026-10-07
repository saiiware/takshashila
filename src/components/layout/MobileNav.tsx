import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Home", icon: "🏠" },
  { to: "/course", label: "Course", icon: "📚" },
  { to: "/learning", label: "Learn", icon: "▶️" },
  { to: "/ai-assistant", label: "Ask AI", icon: "🤖" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-white md:hidden">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-sm font-medium ${
              isActive ? "text-workshop-500" : "text-ink/50"
            }`
          }
        >
          <span className="text-xl" aria-hidden="true">
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
