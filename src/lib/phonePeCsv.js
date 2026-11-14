
import Papa from "papaparse";

function formatDate(dateText) {
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function detectCategory(description) {
  const text = String(description || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Investments
  if (/gold saved|gold purchase|gold sold|digital gold|mutual fund|sip|stock purchase|investment|zerodha|groww|upstox|indstocks/.test(text)) {
    return "Investment";
  }

  // Food and groceries
  if (/food|restaurant|swiggy|zomato|pizza|cafe|dominos|mcdonald|burger|subway|eatfit|blinkit|zepto|instamart|bigbasket|dmart|grocery|groceries|supermarket|jubilant foodworks|tava tadka|rasaganga|amruttulya|farm fresh|madhur dairy/.test(text)) {
    return "Food";
  }

  // Bills
  if (/recharge|mobile|electricity|bill|broadband|jio|airtel|vi recharge|vodafone|bsnl|internet|water bill|gas bill|postpaid|prepaid|dth|google cloud/.test(text)) {
    return "Bills";
  }

  // Travel
  if (/railway|indian railways|irctc|uber|ola|rapido|metro|bmrcl|bus|flight|airline|travel|redbus|makemytrip|petrol|fuel|fastag|parking|indigo|bial/.test(text)) {
    return "Travel";
  }

  // Shopping
  if (/shopping|amazon|flipkart|myntra|ajio|meesho|nykaa|tatacliq|croma|reliance retail|reliance digital|vijay sales|decathlon|lifestyle|westside|mall|lenskart|swami kala kendra/.test(text)) {
    return "Shopping";
  }

  // Health
  if (/hospital|medical|pharmacy|medicine|doctor|clinic|apollo|1mg|netmeds|pharmeasy|diagnostic|lab test/.test(text)) {
    return "Health";
  }

  // Entertainment
  if (/movie|cinema|entertainment|bookmyshow|pvr|inox|netflix|spotify|prime video|hotstar|youtube premium|gaming|jiohotstar/.test(text)) {
    return "Entertainment";
  }

  // Education
  if (/education|school|college|university|course|tuition|udemy|coursera|exam fee/.test(text)) {
    return "Education";
  }

  // Personal care
  if (/salon|haircut|beauty|spa|grooming|barber/.test(text)) {
    return "Personal Care";
  }

  // Bank and loan payments
  if (/idfc first bank|loan repayment|emi payment|bank loan/.test(text)) {
    return "Bank / Loan";
  }

  // Salary
  if (/salary|payroll/.test(text)) {
    return "Salary";
  }

  // Refunds retain the category of the original merchant when recognized.
  // Unrecognized refunds remain Other.

  // Personal transfers to/from individuals
  if (/^(paid to|received from)\s/.test(text)) {
    return "Personal / Transfers";
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

          const headerIndex = rows.findIndex(
            (row) => row[0]?.trim() === "Date"
          );

          if (headerIndex === -1) {
            reject(new Error("This does not look like a valid PhonePe statement."));
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
            String(item || "").trim()
          );

          const validHeader = expectedHeaders.every(
            (header, index) => actualHeaders[index] === header
          );

          if (!validHeader) {
            reject(new Error("PhonePe CSV columns do not match the expected format."));
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

              const type = String(transactionType || "")
                .trim()
                .toUpperCase();

              if (
                !transactionDate ||
                !transactionId?.trim() ||
                !Number.isFinite(numericAmount) ||
                numericAmount <= 0 ||
                !["CREDIT", "DEBIT"].includes(type)
              ) {
                return null;
              }

              const title = String(
                description || "PhonePe transaction"
              ).trim();

              return {
                title,
                kind: type === "CREDIT" ? "income" : "expense",
                category: detectCategory(title),
                amount: numericAmount,
                transaction_date: transactionDate,
                note: `Imported from PhonePe | ${String(time || "").trim()}`,
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
