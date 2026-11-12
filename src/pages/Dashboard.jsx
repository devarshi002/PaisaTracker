
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { getPersonalWallet } from "../lib/wallet";
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
} from "../lib/transactions";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

import "./Dashboard.css";

const categories = [
  "Salary",
  "Food",
  "Rent",
  "Travel",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Education",
  "Other",
];

const today = () => {
  const date = new Date();
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return local.toISOString().slice(0, 10);
};

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export default function Dashboard({ session }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState(today().slice(0, 7));

  const [form, setForm] = useState({
    kind: "expense",
    title: "",
    category: "Food",
    amount: "",
    transaction_date: today(),
    note: "",
  });

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const personalWallet = await getPersonalWallet();
      setWallet(personalWallet);

      const records = await getTransactions(personalWallet.id);
      setTransactions(records || []);
    } catch (err) {
      setError(err.message || "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const monthlyTransactions = useMemo(
    () =>
      transactions.filter(
        (item) => item.transaction_date?.slice(0, 7) === month
      ),
    [transactions, month]
  );

  const totalIncome = monthlyTransactions
    .filter((item) => item.kind === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalExpenses = monthlyTransactions
    .filter((item) => item.kind === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const savings = totalIncome - totalExpenses;

  const savingsRate =
    totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  const categoryTotals = useMemo(() => {
    const totals = {};

    monthlyTransactions
      .filter((item) => item.kind === "expense")
      .forEach((item) => {
        totals[item.category] =
          (totals[item.category] || 0) + Number(item.amount);
      });

    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTransactions]);

  const maxCategory = Math.max(
    1,
    ...categoryTotals.map((item) => item.amount)
  );

  const recentTransactions = [...monthlyTransactions]
    .sort(
      (a, b) =>
        b.transaction_date.localeCompare(a.transaction_date) ||
        b.created_at.localeCompare(a.created_at)
    )
    .slice(0, 8);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!wallet) return;

    if (!form.title.trim() || Number(form.amount) <= 0) {
      setError("Enter a valid title and amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await addTransaction(wallet.id, {
        ...form,
        amount: Number(form.amount),
      });

      setForm({
        kind: "expense",
        title: "",
        category: "Food",
        amount: "",
        transaction_date: today(),
        note: "",
      });

      setShowForm(false);
      setSuccess("Transaction saved successfully!");

      await loadDashboard();
    } catch (err) {
      setError(err.message || "Unable to save transaction");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this transaction?")) return;

    try {
      setError("");
      setSuccess("");

      await deleteTransaction(id);

      setTransactions((previous) =>
        previous.filter((item) => item.id !== id)
      );

      setSuccess("Transaction deleted successfully!");
    } catch (err) {
      setError(err.message || "Unable to delete transaction");
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  }

  const monthLabel = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)) - 1,
    1
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const insight =
    totalIncome === 0 && totalExpenses === 0
      ? "Add your income and expenses to start understanding your finances."
      : totalIncome === 0
      ? "You have expenses recorded, but no income added for this month."
      : savings < 0
      ? "Your expenses are higher than your income. Review your spending."
      : savingsRate >= 30
      ? "Great work! You are saving at least 30% of your income this month."
      : "Look at your spending categories to find opportunities to save more.";

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your PaisaTrack dashboard...</p>
      </div>
    );
  }

  if (error && !wallet) {
    return (
      <div className="dashboard-error">
        <div className="panel">
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
          <button className="primary-button" onClick={loadDashboard}>
            Try again
          </button>
          <button className="secondary-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="app-shell">
        <Sidebar />

        <main className="main-content">
          <Navbar
            month={month}
            setMonth={setMonth}
            email={session?.user?.email}
            walletName={wallet?.name}
            onLogout={handleLogout}
          />

          <div className="dashboard-container">
            {/* Financial overview */}
            <section id="dashboard-overview">
              <div className="page-heading">
                <div>
                  <h1>Financial Overview</h1>
                  <p className="muted">
                    {monthLabel} · {wallet?.name}
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setShowForm(!showForm);
                  }}
                >
                  {showForm ? "Close Form" : "+ Add Transaction"}
                </button>
              </div>

              <div className="stats-grid">
                <article className="stat-card">
                  <div className="stat-card-top">
                    <span className="stat-icon income-icon">↗</span>
                    <span className="stat-label">TOTAL INCOME</span>
                  </div>

                  <h2 className="income-value">
                    {money(totalIncome)}
                  </h2>

                  <small className="muted">Money received</small>
                </article>

                <article className="stat-card">
                  <div className="stat-card-top">
                    <span className="stat-icon expense-icon">↘</span>
                    <span className="stat-label">TOTAL EXPENSES</span>
                  </div>

                  <h2 className="expense-value">
                    {money(totalExpenses)}
                  </h2>

                  <small className="muted">Money spent</small>
                </article>

                <article className="stat-card">
                  <div className="stat-card-top">
                    <span className="stat-icon savings-icon">₹</span>
                    <span className="stat-label">NET SAVINGS</span>
                  </div>

                  <h2
                    className={
                      savings >= 0 ? "savings-value" : "expense-value"
                    }
                  >
                    {money(savings)}
                  </h2>

                  <small className="muted">
                    {totalIncome > 0
                      ? `${savingsRate.toFixed(1)}% savings rate`
                      : "Add income to calculate savings"}
                  </small>

                  <div className="savings-rate">
                    <div
                      className="savings-rate-fill"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, savingsRate)
                        )}%`,
                      }}
                    />
                  </div>
                </article>
              </div>
            </section>

            {/* Analytics */}
            <section
              id="dashboard-analytics"
              className="analytics-grid"
            >
              <article className="panel">
                <h3>Spending by Category</h3>
                <p className="muted">Where your money goes</p>

                {categoryTotals.length === 0 ? (
                  <div className="empty-state">
                    No expenses recorded for {monthLabel}.
                  </div>
                ) : (
                  categoryTotals.map((item) => (
                    <div className="category-item" key={item.category}>
                      <div className="category-heading">
                        <span>{item.category}</span>
                        <strong>{money(item.amount)}</strong>
                      </div>

                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${
                              (item.amount / maxCategory) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </article>

              <article className="panel">
                <h3>Income vs Expenses</h3>
                <p className="muted">Monthly comparison</p>

                <div className="comparison-row">
                  <div className="category-heading">
                    <span>Income</span>
                    <strong className="income-value">
                      {money(totalIncome)}
                    </strong>
                  </div>

                  <div className="comparison-track">
                    <div
                      className="income-bar"
                      style={{
                        width: `${
                          totalIncome + totalExpenses > 0
                            ? (totalIncome /
                                (totalIncome + totalExpenses)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="comparison-row">
                  <div className="category-heading">
                    <span>Expenses</span>
                    <strong className="expense-value">
                      {money(totalExpenses)}
                    </strong>
                  </div>

                  <div className="comparison-track">
                    <div
                      className="expense-bar"
                      style={{
                        width: `${
                          totalIncome + totalExpenses > 0
                            ? (totalExpenses /
                                (totalIncome + totalExpenses)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </article>
            </section>

            {/* PaisaTrack insight */}
            <section className="panel insight-panel">
              <h3>✦ PaisaTrack Insight</h3>
              <p>{insight}</p>
            </section>

            {/* Transactions */}
            <section
              id="dashboard-transactions"
              className="panel transactions-panel"
            >
              <div className="section-header">
                <div>
                  <h3>Recent Transactions</h3>
                  <p className="muted">
                    Your latest activity · {monthLabel}
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    setShowForm(!showForm);
                  }}
                >
                  {showForm ? "Close" : "+ Add Transaction"}
                </button>
              </div>

              {error && (
                <p className="form-message form-error">{error}</p>
              )}

              {success && (
                <p className="form-message form-success">{success}</p>
              )}

              {showForm && (
                <div className="form-panel">
                  <h3>Add Transaction</h3>

                  <form
                    className="transaction-form"
                    onSubmit={handleSubmit}
                  >
                    <label>
                      Type
                      <select
                        value={form.kind}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            kind: e.target.value,
                            category:
                              e.target.value === "income"
                                ? "Salary"
                                : "Food",
                          })
                        }
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </label>

                    <label>
                      Title
                      <input
                        value={form.title}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            title: e.target.value,
                          })
                        }
                        placeholder="e.g. Monthly salary"
                        required
                      />
                    </label>

                    <label>
                      Category
                      <select
                        value={form.category}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            category: e.target.value,
                          })
                        }
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Amount (₹)
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            amount: e.target.value,
                          })
                        }
                        placeholder="Enter amount"
                        required
                      />
                    </label>

                    <label>
                      Date
                      <input
                        type="date"
                        value={form.transaction_date}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            transaction_date: e.target.value,
                          })
                        }
                        required
                      />
                    </label>

                    <label>
                      Note
                      <input
                        value={form.note}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            note: e.target.value,
                          })
                        }
                        placeholder="Optional note"
                      />
                    </label>

                    <button
                      className="primary-button"
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Transaction"}
                    </button>
                  </form>
                </div>
              )}

              <div className="transaction-list">
                {recentTransactions.length === 0 ? (
                  <div className="empty-state">
                    No transactions found for this month.
                  </div>
                ) : (
                  recentTransactions.map((item) => (
                    <div className="transaction-row" key={item.id}>
                      <div className="transaction-details">
                        <div className="transaction-title">
                          {item.title}
                        </div>

                        <small className="muted">
                          {item.category} · {item.transaction_date}
                        </small>

                        {item.note && (
                          <div className="muted">{item.note}</div>
                        )}
                      </div>

                      <div className="transaction-actions">
                        <div
                          className={`transaction-amount ${
                            item.kind === "income"
                              ? "income-value"
                              : "expense-value"
                          }`}
                        >
                          {item.kind === "income" ? "+" : "-"}
                          {money(item.amount)}
                        </div>

                        <button
                          className="delete-button"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <footer className="dashboard-footer">
              © 2026 PaisaTrack · Your money, in one place.
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
