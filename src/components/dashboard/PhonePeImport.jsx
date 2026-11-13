
import { useState } from "react";
import { parsePhonePeCsv } from "../../lib/phonePeCsv";
import "./PhonePeImport.css";

function formatAmount(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function PhonePeImport() {
  const [transactions, setTransactions] = useState([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setTransactions([]);
    setFileName(file.name);

    try {
      const parsedTransactions = await parsePhonePeCsv(file);
      setTransactions(parsedTransactions);
    } catch (err) {
      setError(err.message || "Unable to read this CSV file.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  const totalIncome = transactions
    .filter((item) => item.kind === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpenses = transactions
    .filter((item) => item.kind === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="phonepe-import">
      <div className="phonepe-import-header">
        <div>
          <h2>Import PhonePe Statement</h2>
          <p>Upload your PhonePe CSV to review your transactions.</p>
        </div>
        <span className="import-badge">Review mode</span>
      </div>

      <label className="phonepe-upload">
        <span className="upload-icon">↑</span>
        <strong>Select PhonePe CSV</strong>
        <span>Choose your downloaded transaction statement</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
        />
      </label>

      {fileName && (
        <p className="phonepe-file-name">Selected file: {fileName}</p>
      )}

      {loading && <p className="phonepe-status">Reading your statement...</p>}

      {error && <p className="phonepe-error">{error}</p>}

      {transactions.length > 0 && (
        <>
          <div className="phonepe-summary">
            <div>
              <span>Transactions found</span>
              <strong>{transactions.length}</strong>
            </div>
            <div>
              <span>Total income</span>
              <strong className="income-text">
                {formatAmount(totalIncome)}
              </strong>
            </div>
            <div>
              <span>Total expenses</span>
              <strong className="expense-text">
                {formatAmount(totalExpenses)}
              </strong>
            </div>
          </div>

          <div className="phonepe-preview-heading">
            <div>
              <h3>Transaction Preview</h3>
              <p>Showing up to 10 transactions. Review before importing.</p>
            </div>
            <span>{transactions.length} records</span>
          </div>

          <div className="phonepe-table-wrapper">
            <table className="phonepe-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((item) => (
                  <tr key={item.external_transaction_id}>
                    <td>{item.transaction_date}</td>
                    <td>{item.title}</td>
                    <td>{item.category}</td>
                    <td>
                      <span
                        className={`phonepe-type ${
                          item.kind === "income" ? "income" : "expense"
                        }`}
                      >
                        {item.kind}
                      </span>
                    </td>
                    <td>{formatAmount(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="phonepe-review-note">
            Your transactions have only been parsed locally. They have not
            been saved to PaisaTrack yet.
          </p>
        </>
      )}
    </section>
  );
}
