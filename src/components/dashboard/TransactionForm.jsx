
import "./TransactionForm.css";

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

export default function TransactionForm({
  form,
  setForm,
  onSubmit,
  saving,
}) {
  return (
    <div className="form-panel">
      <h3>Add Transaction</h3>

      <form
        className="transaction-form"
        onSubmit={onSubmit}
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
  );
}
