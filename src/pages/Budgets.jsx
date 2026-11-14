
import { useEffect, useMemo, useState } from "react";

import { getPersonalWallet } from "../lib/wallet";
import { getTransactions } from "../lib/transactions";
import {
  getBudgets,
  deleteBudget,
} from "../lib/budgets";

import BudgetForm from "../components/dashboard/BudgetForm";
import Sidebar from "../components/layout/Sidebar";

import "./Budgets.css";

const currentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export default function Budgets() {
  const [wallet, setWallet] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const personalWallet = await getPersonalWallet();
      setWallet(personalWallet);

      const [budgetRecords, transactionRecords] =
        await Promise.all([
          getBudgets(personalWallet.id, month),
          getTransactions(personalWallet.id),
        ]);

      setBudgets(budgetRecords || []);
      setTransactions(transactionRecords || []);
    } catch (err) {
      setError(err.message || "Unable to load budgets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [month]);

  const budgetDetails = useMemo(() => {
    return budgets.map((budget) => {
      const spent = transactions
        .filter(
          (transaction) =>
            transaction.kind === "expense" &&
            transaction.category === budget.category &&
            transaction.transaction_date?.slice(0, 7) === month
        )
        .reduce(
          (sum, transaction) => sum + Number(transaction.amount),
          0
        );

      const limit = Number(budget.amount);
      const remaining = limit - spent;
      const percentage = (spent / limit) * 100;

      return {
        ...budget,
        spent,
        remaining,
        percentage,
        progress: Math.min(percentage, 100),
      };
    });
  }, [budgets, transactions, month]);

  const totalBudget = budgetDetails.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const totalSpent = budgetDetails.reduce(
    (sum, item) => sum + item.spent,
    0
  );

  const totalRemaining = totalBudget - totalSpent;

  async function handleDelete(id) {
    if (!window.confirm("Delete this budget?")) return;

    try {
      await deleteBudget(id);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete budget.");
    }
  }

  const monthLabel = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)) - 1,
    1
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your budgets...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="app-shell">
        <Sidebar />

        <main className="main-content">
          <div className="dashboard-container">

            <div className="budgets-heading">
              <div>
                <h1>Monthly Budgets</h1>
                <p className="muted">
                  Plan your spending and stay in control of your money.
                </p>
              </div>

              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="budget-month-picker"
              />
            </div>

            {error && (
              <div className="budget-page-error">{error}</div>
            )}

            <section className="budget-overview">
              <article className="budget-overview-card">
                <span>Total Budget</span>
                <strong>{money(totalBudget)}</strong>
                <small>Allocated this month</small>
              </article>

              <article className="budget-overview-card">
                <span>Total Spent</span>
                <strong className="budget-spent-value">
                  {money(totalSpent)}
                </strong>
                <small>Across budgeted categories</small>
              </article>

              <article className="budget-overview-card">
                <span>Remaining Budget</span>
                <strong className={
                  totalRemaining < 0
                    ? "budget-over-value"
                    : "budget-remaining-value"
                }>
                  {money(totalRemaining)}
                </strong>
                <small>
                  {totalRemaining < 0
                    ? "You exceeded your total budget"
                    : "Available to spend"}
                </small>
              </article>
            </section>

            <BudgetForm
              walletId={wallet?.id}
              month={month}
              onBudgetAdded={loadData}
            />

            <section className="budget-list-section">
              <div className="budget-list-heading">
                <div>
                  <h2>Category Budgets</h2>
                  <p className="muted">
                    Your spending progress for {monthLabel}
                  </p>
                </div>

                <span>{budgets.length} budgets</span>
              </div>

              {budgetDetails.length === 0 ? (
                <div className="budget-empty-state">
                  <div className="budget-empty-icon">₹</div>
                  <h3>No budgets created yet</h3>
                  <p>
                    Create your first category budget to start
                    tracking your spending.
                  </p>
                </div>
              ) : (
                <div className="budget-grid">
                  {budgetDetails.map((item) => {
                    const exceeded = item.percentage >= 100;
                    const warning = item.percentage >= 80;

                    return (
                      <article
                        className="budget-card"
                        key={item.id}
                      >
                        <div className="budget-card-top">
                          <div>
                            <h3>{item.category}</h3>
                            <span>
                              Monthly limit: {money(item.amount)}
                            </span>
                          </div>

                          <button
                            className="budget-delete-button"
                            onClick={() => handleDelete(item.id)}
                            title="Delete budget"
                          >
                            ×
                          </button>
                        </div>

                        <div className="budget-card-amounts">
                          <div>
                            <small>Spent</small>
                            <strong>{money(item.spent)}</strong>
                          </div>

                          <div>
                            <small>Remaining</small>
                            <strong className={
                              item.remaining < 0
                                ? "budget-over-value"
                                : "budget-remaining-value"
                            }>
                              {money(item.remaining)}
                            </strong>
                          </div>
                        </div>

                        <div className="budget-progress-track">
                          <div
                            className={`budget-progress-fill ${
                              exceeded
                                ? "over-budget"
                                : warning
                                ? "warning-budget"
                                : ""
                            }`}
                            style={{
                              width: `${item.progress}%`,
                            }}
                          />
                        </div>

                        <div className="budget-card-footer">
                          <span>
                            {item.percentage.toFixed(0)}% used
                          </span>

                          <span className={
                            exceeded
                              ? "budget-status-over"
                              : warning
                              ? "budget-status-warning"
                              : "budget-status-good"
                          }>
                            {exceeded
                              ? "Budget exceeded"
                              : warning
                              ? "Almost at limit"
                              : "On track"}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
