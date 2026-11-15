
import { useEffect, useMemo, useState } from "react";

import { getPersonalWallet } from "../lib/wallet";
import {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  updateSavingsGoalStatus,
  deleteSavingsGoal,
  addSavingsContribution,
  deleteSavingsContribution,
} from "../lib/savingsGoals";

import Sidebar from "../components/layout/Sidebar";

import "./SavingsGoals.css";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const initialGoalForm = {
  name: "",
  target_amount: "",
  deadline: "",
  description: "",
};

const initialContributionForm = {
  amount: "",
  contribution_date: new Date().toLocaleDateString("en-CA"),
  note: "",
};

export default function SavingsGoals() {
  const [wallet, setWallet] = useState(null);
  const [goals, setGoals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalForm, setGoalForm] = useState(initialGoalForm);

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contributionForm, setContributionForm] = useState(
    initialContributionForm
  );

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const personalWallet = await getPersonalWallet();
      setWallet(personalWallet);

      const records = await getSavingsGoals(personalWallet.id);
      setGoals(records || []);
    } catch (err) {
      setError(err.message || "Unable to load savings goals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status === "active"),
    [goals]
  );

  const totalTarget = goals.reduce(
    (sum, goal) => sum + Number(goal.target_amount),
    0
  );

  const totalSaved = goals.reduce(
    (sum, goal) => sum + goal.savedAmount,
    0
  );

  const completedGoals = goals.filter(
    (goal) => goal.status === "completed"
  ).length;

  function openCreateForm() {
    setEditingGoal(null);
    setGoalForm(initialGoalForm);
    setShowGoalForm(true);
    setError("");
    setSuccess("");
  }

  function openEditForm(goal) {
    setEditingGoal(goal);
    setGoalForm({
      name: goal.name,
      target_amount: String(goal.target_amount),
      deadline: goal.deadline || "",
      description: goal.description || "",
    });
    setShowGoalForm(true);
    setError("");
    setSuccess("");
  }

  async function handleGoalSubmit(e) {
    e.preventDefault();

    const target = Number(goalForm.target_amount);

    if (!goalForm.name.trim()) {
      setError("Please enter a goal name.");
      return;
    }

    if (!Number.isFinite(target) || target <= 0) {
      setError("Please enter a valid target amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingGoal) {
        await updateSavingsGoal(editingGoal.id, goalForm);
        setSuccess("Savings goal updated successfully.");
      } else {
        await createSavingsGoal({
          ...goalForm,
          wallet_id: wallet.id,
        });
        setSuccess("Savings goal created successfully.");
      }

      setShowGoalForm(false);
      setEditingGoal(null);
      setGoalForm(initialGoalForm);

      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save savings goal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGoal(id) {
    if (
      !window.confirm(
        "Delete this savings goal and its contribution history?"
      )
    ) {
      return;
    }

    try {
      setError("");
      await deleteSavingsGoal(id);
      setSuccess("Savings goal deleted.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete savings goal.");
    }
  }

  async function handleStatusChange(goal) {
    const nextStatus =
      goal.status === "paused" ? "active" : "paused";

    try {
      setError("");
      await updateSavingsGoalStatus(goal.id, nextStatus);
      setSuccess(
        nextStatus === "paused"
          ? "Savings goal paused."
          : "Savings goal resumed."
      );
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to update goal status.");
    }
  }

  function openContributionForm(goal) {
    setSelectedGoal(goal);
    setContributionForm(initialContributionForm);
    setError("");
    setSuccess("");
  }

  async function handleContributionSubmit(e) {
    e.preventDefault();

    const amount = Number(contributionForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid contribution amount.");
      return;
    }

    if (amount > selectedGoal.remainingAmount) {
      setError(
        `Your remaining target is ${money(
          selectedGoal.remainingAmount
        )}.`
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      await addSavingsContribution({
        goal_id: selectedGoal.id,
        ...contributionForm,
      });
      const newSavedAmount =
  selectedGoal.savedAmount + amount;

if (newSavedAmount >= Number(selectedGoal.target_amount)) {
  await updateSavingsGoalStatus(selectedGoal.id, "completed");
}

      setSelectedGoal(null);
      setContributionForm(initialContributionForm);
      setSuccess("Contribution added successfully!");

      await loadData();
    } catch (err) {
      setError(err.message || "Unable to add contribution.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContribution(id) {
    if (!window.confirm("Delete this contribution?")) return;

    try {
      setError("");
      await deleteSavingsContribution(id);
      setSuccess("Contribution deleted.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete contribution.");
    }
  }

  async function handleCompleteGoal(goal) {
    if (
      !window.confirm(
        "Mark this savings goal as completed?"
      )
    ) {
      return;
    }

    try {
      setError("");
      await updateSavingsGoalStatus(goal.id, "completed");
      setSuccess("Goal marked as completed.");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to complete goal.");
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your savings goals...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="app-shell">
        <Sidebar />

        <main className="main-content">
          <div className="dashboard-container">

            <div className="savings-heading">
              <div>
                <h1>Savings Goals</h1>
                <p className="muted">
                  Turn your financial dreams into achievable goals.
                </p>
              </div>

              <button
                className="savings-primary-button"
                onClick={openCreateForm}
              >
                + Create Goal
              </button>
            </div>

            {error && (
              <div className="savings-message savings-error">
                {error}
              </div>
            )}

            {success && (
              <div className="savings-message savings-success">
                {success}
              </div>
            )}

            <section className="savings-overview">
              <article className="savings-overview-card">
                <span>Total Savings Target</span>
                <strong>{money(totalTarget)}</strong>
                <small>Across all your goals</small>
              </article>

              <article className="savings-overview-card">
                <span>Total Amount Saved</span>
                <strong className="savings-saved-value">
                  {money(totalSaved)}
                </strong>
                <small>From your manual contributions</small>
              </article>

              <article className="savings-overview-card">
                <span>Goals Completed</span>
                <strong className="savings-completed-value">
                  {completedGoals}
                </strong>
                <small>Out of {goals.length} goals</small>
              </article>
            </section>

            {showGoalForm && (
              <section className="savings-form-card">
                <div className="savings-form-heading">
                  <div>
                    <h2>
                      {editingGoal ? "Edit Goal" : "Create a Savings Goal"}
                    </h2>
                    <p className="muted">
                      Define what you're saving for.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="savings-close-button"
                    onClick={() => setShowGoalForm(false)}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleGoalSubmit}>
                  <div className="savings-form-grid">
                    <label>
                      Goal Name *
                      <input
                        type="text"
                        maxLength={100}
                        placeholder="e.g. New laptop"
                        value={goalForm.name}
                        onChange={(e) =>
                          setGoalForm({
                            ...goalForm,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </label>

                    <label>
                      Target Amount (₹) *
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="50000"
                        value={goalForm.target_amount}
                        onChange={(e) =>
                          setGoalForm({
                            ...goalForm,
                            target_amount: e.target.value,
                          })
                        }
                        required
                      />
                    </label>

                    <label>
                      Target Date
                      <input
                        type="date"
                        value={goalForm.deadline}
                        onChange={(e) =>
                          setGoalForm({
                            ...goalForm,
                            deadline: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      Description
                      <input
                        type="text"
                        placeholder="Optional description"
                        value={goalForm.description}
                        onChange={(e) =>
                          setGoalForm({
                            ...goalForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="savings-form-actions">
                    <button
                      type="button"
                      className="savings-secondary-button"
                      onClick={() => setShowGoalForm(false)}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="savings-primary-button"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : editingGoal
                        ? "Update Goal"
                        : "Create Goal"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {selectedGoal && (
              <section className="savings-form-card">
                <div className="savings-form-heading">
                  <div>
                    <h2>Add Contribution</h2>
                    <p className="muted">
                      Adding money to: {selectedGoal.name}
                    </p>
                    <p className="savings-remaining-hint">
                      Remaining: {money(selectedGoal.remainingAmount)}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="savings-close-button"
                    onClick={() => setSelectedGoal(null)}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleContributionSubmit}>
                  <div className="savings-form-grid">
                    <label>
                      Amount (₹) *
                      <input
                        type="number"
                        min="0.01"
                        max={selectedGoal.remainingAmount}
                        step="0.01"
                        placeholder="1000"
                        value={contributionForm.amount}
                        onChange={(e) =>
                          setContributionForm({
                            ...contributionForm,
                            amount: e.target.value,
                          })
                        }
                        required
                      />
                    </label>

                    <label>
                      Contribution Date *
                      <input
                        type="date"
                        value={contributionForm.contribution_date}
                        onChange={(e) =>
                          setContributionForm({
                            ...contributionForm,
                            contribution_date: e.target.value,
                          })
                        }
                        required
                      />
                    </label>

                    <label className="savings-full-width">
                      Note
                      <input
                        type="text"
                        placeholder="Optional note"
                        value={contributionForm.note}
                        onChange={(e) =>
                          setContributionForm({
                            ...contributionForm,
                            note: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>

                  <p className="savings-contribution-note">
                    This is a savings record only. It will not create
                    an expense transaction.
                  </p>

                  <div className="savings-form-actions">
                    <button
                      type="button"
                      className="savings-secondary-button"
                      onClick={() => setSelectedGoal(null)}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="savings-primary-button"
                      disabled={saving}
                    >
                      {saving ? "Adding..." : "Add Contribution"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="savings-list-section">
              <div className="savings-list-heading">
                <div>
                  <h2>Your Goals</h2>
                  <p className="muted">
                    Track your progress, one contribution at a time.
                  </p>
                </div>

                <span>{goals.length} goals</span>
              </div>

              {goals.length === 0 ? (
                <div className="savings-empty-state">
                  <div className="savings-empty-icon">✦</div>
                  <h3>Start your savings journey</h3>
                  <p>
                    Create your first savings goal and start building
                    towards something meaningful.
                  </p>

                  <button
                    className="savings-primary-button"
                    onClick={openCreateForm}
                  >
                    + Create Your First Goal
                  </button>
                </div>
              ) : (
                <div className="savings-grid">
                  {goals.map((goal) => {
                    const isCompleted =
                      goal.status === "completed";

                    const isPaused = goal.status === "paused";

                    const reachedTarget =
                      goal.savedAmount >= Number(goal.target_amount);

                    return (
                      <article
                        className="savings-card"
                        key={goal.id}
                      >
                        <div className="savings-card-top">
                          <div className="savings-goal-title">
                            <h3>{goal.name}</h3>

                            <span
                              className={`savings-status ${
                                isCompleted
                                  ? "status-completed"
                                  : isPaused
                                  ? "status-paused"
                                  : "status-active"
                              }`}
                            >
                              {goal.status}
                            </span>
                          </div>

                          <div className="savings-card-actions">
                            <button
                              type="button"
                              title="Edit goal"
                              onClick={() => openEditForm(goal)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="savings-delete-button"
                              title="Delete goal"
                              onClick={() => handleDeleteGoal(goal.id)}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        {goal.description && (
                          <p className="savings-description">
                            {goal.description}
                          </p>
                        )}

                        <div className="savings-amount-row">
                          <div>
                            <small>Saved so far</small>
                            <strong className="savings-saved-value">
                              {money(goal.savedAmount)}
                            </strong>
                          </div>

                          <div>
                            <small>Target amount</small>
                            <strong>
                              {money(goal.target_amount)}
                            </strong>
                          </div>
                        </div>

                        <div className="savings-progress-track">
                          <div
                            className="savings-progress-fill"
                            style={{
                              width: `${goal.progress}%`,
                            }}
                          />
                        </div>

                        <div className="savings-progress-footer">
                          <span>
                            {goal.progress.toFixed(0)}% achieved
                          </span>

                          <strong>
                            {money(goal.remainingAmount)} left
                          </strong>
                        </div>

                        {goal.deadline && (
                          <p className="savings-deadline">
                            Target date: {goal.deadline}
                          </p>
                        )}

                        {!isCompleted && !isPaused && (
                          <button
                            className="savings-primary-button savings-contribute-button"
                            onClick={() => openContributionForm(goal)}
                            disabled={goal.remainingAmount <= 0}
                          >
                            + Add Contribution
                          </button>
                        )}

                        {isPaused && (
                          <p className="savings-paused-message">
                            This goal is paused. Resume it to add contributions.
                          </p>
                        )}

                        <div className="savings-card-bottom">
                          {!isCompleted && (
                            <button
                              type="button"
                              className="savings-text-button"
                              onClick={() => handleStatusChange(goal)}
                            >
                              {isPaused ? "Resume Goal" : "Pause Goal"}
                            </button>
                          )}

                          {reachedTarget && !isCompleted && (
                            <button
                              type="button"
                              className="savings-text-button savings-complete-button"
                              onClick={() => handleCompleteGoal(goal)}
                            >
                              Mark Completed
                            </button>
                          )}

                          {isCompleted && (
                            <span className="savings-complete-label">
                              ✓ Goal completed
                            </span>
                          )}
                        </div>

                        <div className="savings-history">
                          <h4>
                            Contribution History
                            <span>
                              {goal.contributions.length}
                            </span>
                          </h4>

                          {goal.contributions.length === 0 ? (
                            <p className="savings-no-history">
                              No contributions yet.
                            </p>
                          ) : (
                            <div className="savings-history-list">
                              {[...goal.contributions]
                                .sort(
                                  (a, b) =>
                                    new Date(b.contribution_date) -
                                    new Date(a.contribution_date)
                                )
                                .map((contribution) => (
                                  <div
                                    className="savings-history-item"
                                    key={contribution.id}
                                  >
                                    <div>
                                      <strong>
                                        {money(contribution.amount)}
                                      </strong>

                                      <small>
                                        {contribution.contribution_date}
                                        {contribution.note
                                          ? ` · ${contribution.note}`
                                          : ""}
                                      </small>
                                    </div>

                                    <button
                                      type="button"
                                      title="Delete contribution"
                                      onClick={() =>
                                        handleDeleteContribution(
                                          contribution.id
                                        )
                                      }
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                            </div>
                          )}
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
