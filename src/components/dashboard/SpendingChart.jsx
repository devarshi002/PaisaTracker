
import "./SpendingChart.css";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export default function SpendingChart({ transactions = [], month }) {
  const selectedDate = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)) - 1,
    1
  );

  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() - (5 - index),
      1
    );

    const key = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    const monthTransactions = transactions.filter(
      (item) => item.transaction_date?.slice(0, 7) === key
    );

    const income = monthTransactions
      .filter((item) => item.kind === "income")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const expenses = monthTransactions
      .filter((item) => item.kind === "expense")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      key,
      label: date.toLocaleDateString("en-IN", {
        month: "short",
      }),
      income,
      expenses,
      selected: key === month,
    };
  });

  const maxValue = Math.max(
    1,
    ...monthlyData.flatMap((item) => [
      item.income,
      item.expenses,
    ])
  );

  const selectedData = monthlyData.find(
    (item) => item.selected
  );

  return (
    <article className="panel spending-chart">
      <div className="spending-chart-header">
        <div>
          <h3>Income vs Expenses</h3>
          <p className="muted">Your last 6 months financial trend</p>
        </div>

        <div className="chart-legend">
          <span>
            <i className="legend-dot legend-income"></i>
            Income
          </span>
          <span>
            <i className="legend-dot legend-expense"></i>
            Expenses
          </span>
        </div>
      </div>

      {selectedData &&
      monthlyData.every(
        (item) => item.income === 0 && item.expenses === 0
      ) ? (
        <div className="empty-state">
          No financial activity found for these 6 months.
        </div>
      ) : (
        <>
          <div className="chart-summary">
            <div>
              <span>Selected month income</span>
              <strong className="income-value">
                {money(selectedData?.income)}
              </strong>
            </div>

            <div>
              <span>Selected month expenses</span>
              <strong className="expense-value">
                {money(selectedData?.expenses)}
              </strong>
            </div>
          </div>

          <div className="chart-bars">
            {monthlyData.map((item) => (
              <div
                className={`chart-month ${
                  item.selected ? "selected-month" : ""
                }`}
                key={item.key}
              >
                <div className="chart-bar-group">
                  <div
                    className="chart-bar income-chart-bar"
                    style={{
                      height: `${Math.max(
                        item.income > 0 ? 3 : 0,
                        (item.income / maxValue) * 100
                      )}%`,
                    }}
                    title={`Income: ${money(item.income)}`}
                  />

                  <div
                    className="chart-bar expense-chart-bar"
                    style={{
                      height: `${Math.max(
                        item.expenses > 0 ? 3 : 0,
                        (item.expenses / maxValue) * 100
                      )}%`,
                    }}
                    title={`Expenses: ${money(item.expenses)}`}
                  />
                </div>

                <span className="chart-month-label">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <p className="chart-footer">
            Each pair represents income and expenses for that month.
            The highlighted month matches your month selector.
          </p>
        </>
      )}
    </article>
  );
}
