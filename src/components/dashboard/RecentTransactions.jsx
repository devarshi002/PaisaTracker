
import "./RecentTransactions.css";

export default function RecentTransactions({
  transactions = [],
  monthLabel,
  onDelete,
  onAddClick,
  showForm,
  error,
  success,
  children,
}) {
  return (
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

        
      </div>

      {error && (
        <p className="form-message form-error">{error}</p>
      )}

      {success && (
        <p className="form-message form-success">{success}</p>
      )}

      {children}

      <div className="transaction-list">
        {transactions.length === 0 ? (
          <div className="empty-state">
            No transactions found for this month.
          </div>
        ) : (
          transactions.map((item) => (
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
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(Number(item.amount || 0))}
                </div>

                <button
                  className="delete-button"
                  onClick={() => onDelete(item.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
