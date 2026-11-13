
import Papa from "papaparse";

function formatDate(dateText) {
  const parsed = new Date(dateText);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function detectCategory(description) {
  const text = description.toLowerCase();

  if (/food|restaurant|swiggy|zomato|pizza|cafe|hotel/.test(text)) {
    return "Food";
  }

  if (/recharge|mobile|electricity|bill|broadband/.test(text)) {
    return "Bills";
  }

  if (/railway|uber|ola|metro|bus|flight|travel/.test(text)) {
    return "Travel";
  }

  if (/shopping|amazon|flipkart|myntra/.test(text)) {
    return "Shopping";
  }

  if (/hospital|medical|pharmacy|medicine/.test(text)) {
    return "Health";
  }

  if (/movie|cinema|entertainment/.test(text)) {
    return "Entertainment";
  }

  if (/gold saved|gold purchase/.test(text)) {
    return "Other";
  }

  if (/salary/.test(text)) {
    return "Salary";
  }

  return "Other";
}

export function parsePhonePeCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data;

          // Find the actual transaction header.
          const headerIndex = rows.findIndex(
            (row) => row[0]?.trim() === "Date"
          );

          if (headerIndex === -1) {
            reject(
              new Error("This does not look like a valid PhonePe statement.")
            );
            return;
          }

          const expectedHeaders = [
            "Date",
            "Time",
            "Transaction Details",
            "Transaction ID",
            "UTR",
            "Transaction Type",
            "Credit/debit instrument",
            "Amount",
          ];

          const actualHeaders = rows[headerIndex].map((item) =>
            item.trim()
          );

          const validHeader = expectedHeaders.every(
            (header, index) => actualHeaders[index] === header
          );

          if (!validHeader) {
            reject(
              new Error("PhonePe CSV columns do not match the expected format.")
            );
            return;
          }

          const transactions = rows
            .slice(headerIndex + 1)
            .filter((row) => row.length >= 8)
            .map((row) => {
              const [
                date,
                time,
                description,
                transactionId,
                utr,
                transactionType,
                instrument,
                amount,
              ] = row;

              const transactionDate = formatDate(date);

              const numericAmount = Number(
                String(amount).replace(/,/g, "").trim()
              );

              const type = transactionType?.trim().toUpperCase();

              if (
                !transactionDate ||
                !transactionId?.trim() ||
                !Number.isFinite(numericAmount) ||
                numericAmount <= 0 ||
                !["CREDIT", "DEBIT"].includes(type)
              ) {
                return null;
              }

              const title = description?.trim();

              return {
                title: title || "PhonePe transaction",
                kind: type === "CREDIT" ? "income" : "expense",
                category:
                  type === "CREDIT"
                    ? "Other"
                    : detectCategory(title || ""),
                amount: numericAmount,
                transaction_date: transactionDate,
                note: `Imported from PhonePe | ${time?.trim() || ""}`,
                external_transaction_id: transactionId.trim(),
                external_utr: utr?.trim() || null,
                payment_instrument: instrument?.trim() || "",
                source: "phonepe",
              };
            })
            .filter(Boolean);

          if (transactions.length === 0) {
            reject(new Error("No valid transactions found in this CSV."));
            return;
          }

          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error),
    });
  });
}
