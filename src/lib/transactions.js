
import { supabase } from "./supabase";

// Fetch transactions for a wallet
export async function getTransactions(walletId) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("wallet_id", walletId)
    .order("transaction_date", { ascending: false });

  if (error) throw error;
  return data;
}

// Add income or expense
export async function addTransaction(walletId, transaction) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Please login first");

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      wallet_id: walletId,
      created_by: user.id,
      kind: transaction.kind,
      title: transaction.title.trim(),
      category: transaction.category,
      amount: Number(transaction.amount),
      transaction_date: transaction.transaction_date,
      note: transaction.note || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Find existing PhonePe transaction IDs
export async function getExistingPhonePeTransactionIds(
  walletId,
  transactionIds
) {
  if (!transactionIds.length) return [];

  const existingIds = [];

  for (let i = 0; i < transactionIds.length; i += 500) {
    const batch = transactionIds.slice(i, i + 500);

    const { data, error } = await supabase
      .from("transactions")
      .select("external_transaction_id")
      .eq("wallet_id", walletId)
      .eq("source", "phonepe")
      .in("external_transaction_id", batch);

    if (error) throw error;

    existingIds.push(
      ...(data || []).map((item) => item.external_transaction_id)
    );
  }

  return existingIds;
}

// Import PhonePe transactions while safely ignoring duplicates
export async function importPhonePeTransactions(walletId, transactions) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Please login first");

  if (!transactions.length) {
    return { importedCount: 0 };
  }

  const rows = transactions.map((transaction) => {
    if (!transaction.external_transaction_id) {
      throw new Error(
        "A PhonePe transaction is missing its external transaction ID."
      );
    }

    return {
      wallet_id: walletId,
      created_by: user.id,
      kind: transaction.kind,
      title: transaction.title.trim(),
      category: transaction.category,
      amount: Number(transaction.amount),
      transaction_date: transaction.transaction_date,
      note: transaction.note || null,
      source: "phonepe",
      external_transaction_id: transaction.external_transaction_id,
      external_utr: transaction.external_utr || null,
      payment_instrument: transaction.payment_instrument || null,
    };
  });

  const { data, error } = await supabase
    .from("transactions")
    .upsert(rows, {
      onConflict: "wallet_id,source,external_transaction_id",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) throw error;

  return {
    importedCount: data?.length || 0,
  };
}

// Clear only PhonePe-imported transactions for a wallet
export async function clearPhonePeTransactions(walletId) {
  if (!walletId) {
    throw new Error("Wallet not found.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Please login first");

  // Fetch matching records first so we can report the deletion count
  const { data: existingRecords, error: fetchError } = await supabase
    .from("transactions")
    .select("id")
    .eq("wallet_id", walletId)
    .eq("source", "phonepe");

  if (fetchError) throw fetchError;

  if (!existingRecords || existingRecords.length === 0) {
    return 0;
  }

  // Delete only records imported from PhonePe in this wallet
  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .eq("wallet_id", walletId)
    .eq("source", "phonepe");

  if (deleteError) throw deleteError;

  return existingRecords.length;
}

// Delete an individual transaction
export async function deleteTransaction(transactionId) {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);

  if (error) throw error;
}
