
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

// Delete a transaction
export async function deleteTransaction(transactionId) {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);

  if (error) throw error;
}
