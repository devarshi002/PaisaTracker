
import "./CategoryBreakdown.css";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export default function CategoryBreakdown({
  categoryTotals = [],
}) {
  const maxCategory = Math.max(
    1,
    ...categoryTotals.map((item) => item.amount)
  );

  const totalExpenses = categoryTotals.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  return (
    <article className="panel category-breakdown">
      <div className="category-breakdown-header">
        <div>
          <h3>Spending by Category</h3>
          <p className="muted">Where your money goes</p>
        </div>

        <span className="category-total">
          {money(totalExpenses)}
        </span>
      </div>

      {categoryTotals.length === 0 ? (
        <div className="empty-state">
          No expenses recorded for this month.
        </div>
      ) : (
        <div className="category-breakdown-list">
          {categoryTotals.map((item) => {
            const percentage =
              totalExpenses > 0
                ? (item.amount / totalExpenses) * 100
                : 0;

            return (
              <div
                className="category-breakdown-item"
                key={item.category}
              >
                <div className="category-breakdown-info">
                  <span>{item.category}</span>
                  <div className="category-breakdown-amount">
                    <strong>{money(item.amount)}</strong>
                    <small>{percentage.toFixed(1)}%</small>
                  </div>
                </div>

                <div className="category-breakdown-track">
                  <div
                    className="category-breakdown-fill"
                    style={{
                      width: `${(item.amount / maxCategory) * 100}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
