
import { supabase } from "./supabase";

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("User not authenticated");

  return user;
}

export async function getSavingsGoals(walletId) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("savings_goals")
    .select(`
      *,
      savings_contributions (
        id,
        amount,
        contribution_date,
        note,
        created_at
      )
    `)
    .eq("wallet_id", walletId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((goal) => {
    const contributions = goal.savings_contributions || [];

    const savedAmount = contributions.reduce(
      (total, contribution) =>
        total + Number(contribution.amount),
      0
    );

    return {
      ...goal,
      contributions,
      savedAmount,
      remainingAmount: Math.max(
        Number(goal.target_amount) - savedAmount,
        0
      ),
      progress: Math.min(
        (savedAmount / Number(goal.target_amount)) * 100,
        100
      ),
    };
  });
}

export async function createSavingsGoal(goal) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("savings_goals")
    .insert({
      user_id: user.id,
      wallet_id: goal.wallet_id,
      name: goal.name.trim(),
      target_amount: Number(goal.target_amount),
      deadline: goal.deadline || null,
      description: goal.description?.trim() || null,
      status: "active",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateSavingsGoal(id, updates) {
  const { data, error } = await supabase
    .from("savings_goals")
    .update({
      name: updates.name.trim(),
      target_amount: Number(updates.target_amount),
      deadline: updates.deadline || null,
      description: updates.description?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateSavingsGoalStatus(id, status) {
  const { error } = await supabase
    .from("savings_goals")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteSavingsGoal(id) {
  const { error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function addSavingsContribution(contribution) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("savings_contributions")
    .insert({
      goal_id: contribution.goal_id,
      user_id: user.id,
      amount: Number(contribution.amount),
      contribution_date:
        contribution.contribution_date || new Date().toLocaleDateString("en-CA"),
      note: contribution.note?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteSavingsContribution(id) {
  const { error } = await supabase
    .from("savings_contributions")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
