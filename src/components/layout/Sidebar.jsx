
import { NavLink, useLocation } from "react-router-dom";
import "./Sidebar.css";

const navigation = [
  {
    label: "Dashboard",
    icon: "▦",
    href: "/dashboard#dashboard-overview",
    section: "dashboard-overview",
  },
  {
    label: "Analytics",
    icon: "◫",
    href: "/dashboard#dashboard-analytics",
    section: "dashboard-analytics",
  },
  {
    label: "Transactions",
    icon: "⇄",
    href: "/dashboard#dashboard-transactions",
    section: "dashboard-transactions",
  },
  {
    label: "Budgets",
    icon: "◷",
    href: "/budgets",
  },
  {
    label: "Savings Goals",
    icon: "✦",
    href: "/savings-goals",
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">₹</div>
        <div>
          <h2>PaisaTrack</h2>
          <span>SMART FINANCE</span>
        </div>
      </div>

      <div className="sidebar-section-label">MENU</div>

      <nav className="sidebar-navigation">
        {navigation.map((item) => {
          const isActive = item.section
            ? location.pathname === "/dashboard" &&
              (location.hash === `#${item.section}` ||
                (!location.hash &&
                  item.section === "dashboard-overview"))
            : location.pathname === item.href;

          return (
            <NavLink
              key={item.label}
              to={item.href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <span>✦</span>
          <strong>Manage your money smarter.</strong>
          <p>Every rupee has a purpose.</p>
        </div>

        <p className="sidebar-version">PaisaTrack · v1.0</p>
      </div>
    </aside>
  );
}
