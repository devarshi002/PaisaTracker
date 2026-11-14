
import { supabase } from "./supabase";

// Get all budgets for a wallet and selected month
export async function getBudgets(walletId, month) {
  const budgetMonth = `${month.slice(0, 7)}-01`;

  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("wallet_id", walletId)
    .eq("budget_month", budgetMonth)
    .order("category", { ascending: true });

  if (error) throw error;

  return data || [];
}

// Create a new budget
export async function addBudget(walletId, budget) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Please login first");

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      wallet_id: walletId,
      created_by: user.id,
      category: budget.category,
      amount: Number(budget.amount),
      budget_month: `${budget.month.slice(0, 7)}-01`,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Update an existing budget
export async function updateBudget(budgetId, amount) {
  const { data, error } = await supabase
    .from("budgets")
    .update({
      amount: Number(amount),
      updated_at: new Date().toISOString(),
    })
    .eq("id", budgetId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Delete a budget
export async function deleteBudget(budgetId) {
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId);

  if (error) throw error;
}
