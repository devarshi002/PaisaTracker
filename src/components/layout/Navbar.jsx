
import "./Navbar.css";

export default function Navbar({
  month,
  setMonth,
  email,
  walletName,
  onLogout,
}) {
  return (
    <header className="app-navbar">
      <div className="navbar-welcome">
        <h2>Good evening! 👋</h2>
        <p>Welcome back. Here's your financial overview.</p>
      </div>

      <div className="navbar-actions">
        <input
          className="navbar-month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Select dashboard month"
        />

        <div className="navbar-profile">
          <div className="profile-avatar">
            {email?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="profile-info">
            <strong>{email?.split("@")[0] || "User"}</strong>
            <span>{walletName || "Personal Wallet"}</span>
          </div>
        </div>

        <button className="navbar-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
