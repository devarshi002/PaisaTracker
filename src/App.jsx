
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";

import { supabase } from "./lib/supabase";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

//import "./App.css";

function Home() {
  return (
    <div className="home-page">
      <nav className="home-navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">₹</span>
          <span>PaisaTrack</span>
        </Link>

        <div className="home-nav-links">
          <a href="#features">Features</a>
          <Link to="/login" className="nav-login">Login</Link>
          <Link to="/signup" className="nav-signup">
            Get Started
          </Link>
        </div>
      </nav>

      <main>
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-tag">
              <span className="hero-tag-dot"></span>
              YOUR PERSONAL FINANCE COMPANION
            </div>

            <h1>
              Take control of
              <br />
              your money.
              <span className="hero-highlight"> Build your future.</span>
            </h1>

            <p className="hero-description">
              Track your income, manage expenses and understand your
              spending habits. Everything you need to make smarter
              financial decisions, all in one place.
            </p>

            <div className="hero-actions">
              <Link to="/signup" className="hero-primary-button">
                Get Started Free <span>→</span>
              </Link>

              <Link to="/login" className="hero-secondary-button">
                I already have an account
              </Link>
            </div>

            <div className="hero-trust">
              <span>✓</span> Simple expense tracking
              <span>✓</span> Your personal financial overview
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow"></div>

            <div className="preview-card">
              <div className="preview-top">
                <div>
                  <span className="preview-label">TOTAL BALANCE</span>
                  <h2>₹48,250.00</h2>
                </div>
                <span className="preview-icon">₹</span>
              </div>

              <div className="preview-divider"></div>

              <div className="preview-stats">
                <div>
                  <span className="stat-icon income-icon">↗</span>
                  <div>
                    <small>Income</small>
                    <strong>₹65,000</strong>
                  </div>
                </div>

                <div>
                  <span className="stat-icon expense-icon">↘</span>
                  <div>
                    <small>Expenses</small>
                    <strong>₹16,750</strong>
                  </div>
                </div>
              </div>

              <div className="preview-chart-heading">
                <strong>Spending overview</strong>
                <span>This month</span>
              </div>

              <div className="preview-chart">
                {[35, 55, 42, 75, 48, 90, 65, 55, 82, 48, 68, 95].map(
                  (height, index) => (
                    <div
                      className={`chart-bar ${index === 11 ? "chart-bar-active" : ""}`}
                      style={{ height: `${height}%` }}
                      key={index}
                    />
                  )
                )}
              </div>

              <div className="preview-footer">
                <span>Smart money management</span>
                <span>✦ PaisaTrack</span>
              </div>
            </div>

            <div className="floating-card floating-income">
              <span className="floating-icon">↗</span>
              <div>
                <small>Income tracked</small>
                <strong>₹65,000</strong>
              </div>
            </div>

            <div className="floating-card floating-savings">
              <span className="floating-icon">✦</span>
              <div>
                <small>Money insight</small>
                <strong>Stay on track!</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <span>MADE FOR YOUR FINANCIAL JOURNEY</span>
            <h2>Everything your money needs.</h2>
            <p>
              Take the guesswork out of managing your finances.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon purple">↗</div>
              <h3>Track Income</h3>
              <p>
                Keep your income organized and understand how much
                money you receive.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon blue">₹</div>
              <h3>Manage Expenses</h3>
              <p>
                Record daily spending and organize transactions
                by category.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon green">✦</div>
              <h3>Smart Insights</h3>
              <p>
                Understand your spending patterns and discover
                opportunities to save.
              </p>
            </article>
          </div>
        </section>

        <section className="cta-section">
          <h2>Your money deserves a better plan.</h2>
          <p>Start building better financial habits with PaisaTrack.</p>
          <Link to="/signup" className="hero-primary-button">
            Create Your Free Account →
          </Link>
        </section>
      </main>

      <footer className="home-footer">
        <Link to="/" className="brand">
          <span className="brand-icon">₹</span>
          <span>PaisaTrack</span>
        </Link>
        <span>© 2026 PaisaTrack. Your money, in one place.</span>
      </footer>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        console.error(error.message);
      }

      setSession(data.session);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            session
              ? <Navigate to="/dashboard" replace />
              : <Home />
          }
        />

        <Route
          path="/signup"
          element={
            session
              ? <Navigate to="/dashboard" replace />
              : <Signup />
          }
        />

        <Route
          path="/login"
          element={
            session
              ? <Navigate to="/dashboard" replace />
              : <Login />
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute session={session} loading={loading}>
              <Dashboard session={session} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
