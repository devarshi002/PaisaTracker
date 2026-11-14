
import { useState } from "react";
import { parsePhonePeCsv } from "../../lib/phonePeCsv";
import {
  getExistingPhonePeTransactionIds,
  importPhonePeTransactions,
} from "../../lib/transactions";
import "./PhonePeImport.css";

function formatAmount(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function PhonePeImport({ walletId, onImported }) {
  const [transactions, setTransactions] = useState([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setTransactions([]);
    setFileName(file.name);

    try {
      if (!walletId) {
        throw new Error("Your wallet is not ready. Please try again.");
      }

      const parsedTransactions = await parsePhonePeCsv(file);

      if (!parsedTransactions.length) {
        throw new Error("No valid transactions were found in this CSV.");
      }

      const ids = parsedTransactions
        .map((item) => item.external_transaction_id)
        .filter(Boolean);

      if (ids.length !== parsedTransactions.length) {
        throw new Error(
          "Some transactions are missing their transaction IDs. Please check your CSV parser."
        );
      }

      const existingIds = await getExistingPhonePeTransactionIds(
        walletId,
        [...new Set(ids)]
      );

      const existingSet = new Set(existingIds);

      const reviewedTransactions = parsedTransactions.map((item) => ({
        ...item,
        isDuplicate: existingSet.has(item.external_transaction_id),
      }));

      setTransactions(reviewedTransactions);
    } catch (err) {
      setError(err.message || "Unable to read this CSV file.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  async function handleImport() {
    const newTransactions = transactions.filter(
      (item) => !item.isDuplicate
    );

    if (!newTransactions.length) {
      setError("There are no new transactions to import.");
      return;
    }

    setImporting(true);
    setError("");
    setSuccess("");

    try {
      const result = await importPhonePeTransactions(
        walletId,
        newTransactions
      );

      const skippedCount = transactions.length - result.importedCount;

      setTransactions((current) =>
        current.map((item) => ({ ...item, isDuplicate: true }))
      );

      setSuccess(
        `Successfully imported ${result.importedCount} transactions. ${skippedCount} duplicates skipped.`
      );

      if (onImported) {
        await onImported();
      }
    } catch (err) {
      setError(err.message || "Unable to import transactions.");
    } finally {
      setImporting(false);
    }
  }

  const totalIncome = transactions
    .filter((item) => item.kind === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalExpenses = transactions
    .filter((item) => item.kind === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const duplicateCount = transactions.filter(
    (item) => item.isDuplicate
  ).length;

  const newCount = transactions.length - duplicateCount;

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
          disabled={loading || importing}
        />
      </label>

      {fileName && (
        <p className="phonepe-file-name">Selected file: {fileName}</p>
      )}

      {loading && (
        <p className="phonepe-status">
          Reading statement and checking duplicates...
        </p>
      )}

      {error && <p className="phonepe-error">{error}</p>}
      {success && <p className="phonepe-success">{success}</p>}

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

          <div className="phonepe-import-counts">
            <span>New transactions: <strong>{newCount}</strong></span>
            <span>Duplicates: <strong>{duplicateCount}</strong></span>
          </div>

          <div className="phonepe-preview-heading">
            <div>
              <h3>Transaction Preview</h3>
              <p>Review the transactions before importing.</p>
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
                  <th>Status</th>
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
                    <td>
                      <span
                        className={
                          item.isDuplicate
                            ? "phonepe-duplicate"
                            : "phonepe-new"
                        }
                      >
                        {item.isDuplicate ? "Duplicate" : "New"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length > 10 && (
            <p className="phonepe-review-note">
              Showing the first 10 of {transactions.length} transactions.
            </p>
          )}

          <button
            type="button"
            className="phonepe-import-button"
            onClick={handleImport}
            disabled={importing || loading || newCount === 0}
          >
            {importing
              ? "Importing..."
              : `Import ${newCount} New Transactions`}
          </button>

          <p className="phonepe-review-note">
            Duplicate transactions will be skipped automatically.
          </p>
        </>
      )}
    </section>
  );
}
