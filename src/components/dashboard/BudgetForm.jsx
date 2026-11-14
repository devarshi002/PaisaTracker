
import { useState } from "react";
import { addBudget } from "../../lib/budgets";
import "./BudgetForm.css";

const categories = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Rent",
  "Fuel",
  "Other",
];

export default function BudgetForm({
  walletId,
  month,
  onBudgetAdded,
}) {
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid budget amount.");
      return;
    }

    try {
      setSaving(true);

      await addBudget(walletId, {
        category,
        amount,
        month,
      });

      setAmount("");
      setSuccess(`${category} budget created successfully!`);

      await onBudgetAdded?.();
    } catch (err) {
      if (err.code === "23505") {
        setError(
          `A ${category} budget already exists for this month.`
        );
      } else {
        setError(err.message || "Unable to create budget.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="budget-form" onSubmit={handleSubmit}>
      <div className="budget-form-heading">
        <div>
          <h3>Create Monthly Budget</h3>
          <p>Set a spending limit for a category.</p>
        </div>
      </div>

      <div className="budget-form-fields">
        <div className="budget-field">
          <label htmlFor="budget-category">Category</label>

          <select
            id="budget-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="budget-field">
          <label htmlFor="budget-amount">Monthly limit (₹)</label>

          <input
            id="budget-amount"
            type="number"
            min="1"
            step="0.01"
            placeholder="e.g. 5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="budget-submit-button"
          disabled={saving || !walletId}
        >
          {saving ? "Saving..." : "Create Budget"}
        </button>
      </div>

      {error && <p className="budget-form-error">{error}</p>}
      {success && <p className="budget-form-success">{success}</p>}
    </form>
  );
}
