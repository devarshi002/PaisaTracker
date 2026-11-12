
import "./Sidebar.css";

const navigation = [
  { label: "Dashboard", icon: "▦", href: "#dashboard-overview" },
  { label: "Analytics", icon: "◫", href: "#dashboard-analytics" },
  { label: "Transactions", icon: "⇄", href: "#dashboard-transactions" },
];

export default function Sidebar() {
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
        {navigation.map((item, index) => (
          <a
            key={item.label}
            href={item.href}
            className={`sidebar-link ${index === 0 ? "active" : ""}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </a>
        ))}
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
