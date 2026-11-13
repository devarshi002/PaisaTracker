
import "./SummaryCards.css";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export default function SummaryCards({
  totalIncome,
  totalExpenses,
  savings,
  savingsRate,
}) {
  const cards = [
    {
      label: "TOTAL INCOME",
      amount: totalIncome,
      description: "Money received",
      icon: "↗",
      type: "income",
    },
    {
      label: "TOTAL EXPENSES",
      amount: totalExpenses,
      description: "Money spent",
      icon: "↘",
      type: "expense",
    },
    {
      label: "NET SAVINGS",
      amount: savings,
      description:
        totalIncome > 0
          ? `${savingsRate.toFixed(1)}% savings rate`
          : "Add income to calculate savings",
      icon: "₹",
      type: savings >= 0 ? "savings" : "expense",
    },
  ];

  return (
    <div className="summary-cards">
      {cards.map((card) => (
        <article className="summary-card" key={card.label}>
          <div className="summary-card-header">
            <div className={`summary-icon ${card.type}-icon`}>
              {card.icon}
            </div>
            <span className="summary-label">{card.label}</span>
          </div>

          <h2 className={`${card.type}-value`}>
            {money(card.amount)}
          </h2>

          <p className="summary-description">
            {card.description}
          </p>

          {card.label === "NET SAVINGS" && (
            <div className="summary-progress">
              <div
                className="summary-progress-fill"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, savingsRate)
                  )}%`,
                }}
              />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
