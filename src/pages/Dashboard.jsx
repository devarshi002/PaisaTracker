
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

import CategoryBreakdown from "../components/dashboard/CategoryBreakdown";
import SpendingChart from "../components/dashboard/SpendingChart";
import SummaryCards from "../components/dashboard/SummaryCards";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import TransactionForm from "../components/dashboard/TransactionForm";
import PhonePeImport from "../components/dashboard/PhonePeImport";

import "./Dashboard.css";

const today = () => {
  const date = new Date();

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 10);
};

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

  // Load wallet and transactions
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

  // Filter transactions for selected month
  const monthlyTransactions = useMemo(
    () =>
      transactions.filter(
        (item) => item.transaction_date?.slice(0, 7) === month
      ),
    [transactions, month]
  );

  // Calculate income
  const totalIncome = monthlyTransactions
    .filter((item) => item.kind === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  // Calculate expenses
  const totalExpenses = monthlyTransactions
    .filter((item) => item.kind === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  // Calculate savings
  const savings = totalIncome - totalExpenses;

  const savingsRate =
    totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  // Calculate expense category totals
  const categoryTotals = useMemo(() => {
    const totals = {};

    monthlyTransactions
      .filter((item) => item.kind === "expense")
      .forEach((item) => {
        totals[item.category] =
          (totals[item.category] || 0) + Number(item.amount);
      });

    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTransactions]);

  // Recent transactions
  const recentTransactions = [...monthlyTransactions]
    .sort(
      (a, b) =>
        b.transaction_date.localeCompare(a.transaction_date) ||
        (b.created_at || "").localeCompare(a.created_at || "")
    )
    .slice(0, 8);

  // Add manual transaction
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

  // Delete transaction
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

  // Logout
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
    }
  }

  // Selected month label
  const monthLabel = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)) - 1,
    1
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // Financial insight
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

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your PaisaTrack dashboard...</p>
      </div>
    );
  }

  // Dashboard error state
  if (error && !wallet) {
    return (
      <div className="dashboard-error">
        <div className="panel">
          <h2>Unable to load dashboard</h2>

          <p>{error}</p>

          <button
            className="primary-button"
            onClick={loadDashboard}
          >
            Try again
          </button>

          <button
            className="secondary-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="app-shell">

        {/* Sidebar */}
        <Sidebar />

        <main className="main-content">

          {/* Navbar */}
          <Navbar
            month={month}
            setMonth={setMonth}
            email={session?.user?.email}
            walletName={wallet?.name}
            onLogout={handleLogout}
          />

          <div className="dashboard-container">

            {/* Financial Overview */}
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

              {/* Summary Cards */}
              <SummaryCards
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                savings={savings}
                savingsRate={savingsRate}
              />

              {/* Manual Transaction Form */}
              {showForm && (
                <TransactionForm
                  form={form}
                  setForm={setForm}
                  onSubmit={handleSubmit}
                  saving={saving}
                />
              )}

              {/* PhonePe CSV Import */}
              <PhonePeImport />

            </section>

            {/* Analytics */}
            <section
              id="dashboard-analytics"
              className="analytics-grid"
            >
              <CategoryBreakdown
                categoryTotals={categoryTotals}
              />

              <SpendingChart
                transactions={transactions}
                month={month}
              />
            </section>

            {/* PaisaTrack Insight */}
            <section className="panel insight-panel">
              <h3>✦ PaisaTrack Insight</h3>

              <p>{insight}</p>
            </section>

            {/* Recent Transactions */}
            <section id="dashboard-transactions">
              <RecentTransactions
                transactions={recentTransactions}
                monthLabel={monthLabel}
                onDelete={handleDelete}
                error={error}
                success={success}
              />
            </section>

            {/* Footer */}
            <footer className="dashboard-footer">
              © 2026 PaisaTrack · Your money, in one place.
            </footer>

          </div>
        </main>
      </div>
    </div>
  );
}
