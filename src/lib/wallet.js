
import { supabase } from "./supabase";

export async function getPersonalWallet() {
  const { data: { user }, error: userError } =
    await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("wallet_members")
    .select(`
      wallet_id,
      role,
      wallets (
        id,
        name,
        kind
      )
    `)
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (error) throw error;

  const personalWallet = data
    .map((member) => member.wallets)
    .find((wallet) => wallet?.kind === "personal");

  if (!personalWallet) {
    throw new Error("Personal wallet not found");
  }

  return personalWallet;
}
