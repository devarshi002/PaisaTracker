
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        navigate("/dashboard");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <Link to="/" className="brand auth-brand">
          <span className="brand-icon">₹</span>
          <span>PaisaTrack</span>
        </Link>

        <div className="auth-brand-content">
          <span className="auth-eyebrow">YOUR MONEY. YOUR CONTROL.</span>
          <h1>
            Make every
            <br />
            rupee <span>count.</span>
          </h1>
          <p>
            A clearer picture of your money starts here.
            Track, manage and make smarter financial decisions.
          </p>

          <div className="auth-brand-bottom">
            <span>✦</span> Take control of your financial journey.
          </div>
        </div>

        <div className="auth-panel-decoration"></div>
      </div>

      <div className="auth-form-panel">
        <Link to="/" className="mobile-brand brand">
          <span className="brand-icon">₹</span>
          <span>PaisaTrack</span>
        </Link>

        <div className="auth-form-container">
          <div className="auth-form-heading">
            <span className="auth-eyebrow">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>Enter your details to access your dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <div className="password-label-row">
  <label htmlFor="login-password">Password</label>
  <Link to="/forgot-password" className="forgot-password-link">
    Forgot password?
  </Link>
</div>

            <div className="password-field">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {message && (
              <div className="auth-message auth-error" role="alert">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Create account</Link>
          </p>

          <Link to="/" className="auth-back-link">
            ← Back to home
          </Link>
        </div>

        <div className="auth-legal">
          © 2026 PaisaTrack. Your money, in one place.
        </div>
      </div>
    </div>
  );
}
