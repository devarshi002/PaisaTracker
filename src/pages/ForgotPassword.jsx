
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      setMessage(
        "Password reset link sent! Please check your email inbox."
      );
    } catch (err) {
      setError(err.message || "Unable to send reset email.");
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
          <span className="auth-eyebrow">ACCOUNT RECOVERY</span>
          <h1>
            A fresh start
            <br />
            is just one step <span>away.</span>
          </h1>
          <p>
            Forgot your password? Don't worry.
            We'll help you securely get back into your account.
          </p>
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
            <span className="auth-eyebrow">RESET PASSWORD</span>
            <h2>Forgot your password?</h2>
            <p>
              Enter your registered email address.
              We'll send you a password reset link.
            </p>
          </div>

          <form onSubmit={handleReset} className="auth-form">
            <label htmlFor="reset-email">Email address</label>

            <input
              id="reset-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            {error && (
              <div className="auth-message auth-error">
                {error}
              </div>
            )}

            {message && (
              <div className="auth-message auth-success">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Sending link..." : "Send Reset Link"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <p className="auth-switch">
            Remember your password? <Link to="/login">Sign in</Link>
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
