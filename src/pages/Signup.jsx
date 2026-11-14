
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Auth.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage(
        data.session
          ? "Account created successfully!"
          : "Account created! Please check your email to verify it."
      );
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
          <span className="auth-eyebrow">START YOUR JOURNEY</span>
          <h1>
            Your future
            <br />
            starts with <span>better habits.</span>
          </h1>
          <p>
            Build a healthier relationship with money.
            Organize your finances and make every decision count.
          </p>

          <div className="auth-brand-bottom">
            <span>✦</span> Simple. Organized. In control.
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
            <span className="auth-eyebrow">GET STARTED</span>
            <h2>Create your account</h2>
            <p>Join PaisaTrack and take control of your money.</p>
          </div>

          <form onSubmit={handleSignup} className="auth-form">
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />

            <label htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="signup-password">Password</label>

            <div className="password-field">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
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

            <p className="password-hint">
              Use at least 8 characters for your password.
            </p>

            {message && (
              <div
                className={`auth-message ${
                  message.includes("successfully") ||
                  message.includes("check your email")
                    ? "auth-success"
                    : "auth-error"
                }`}
                role="status"
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
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
