import { supabase } from './supabase.js';

// These client helpers rely on Supabase RLS. Never put the service-role key in Vite.
export async function getMyWallets() {
  const { data, error } = await supabase
    .from('wallets')
    .select('id,name,kind,owner_id,invite_code,created_at,wallet_members(role,is_active)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getWalletTransactions(walletId, from, to) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('wallet_id', walletId)
    .gte('transaction_date', from)
    .lte('transaction_date', to)
    .order('transaction_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addWalletTransaction(transaction) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in first.');
  const { data, error } = await supabase.from('transactions')
    .insert({ ...transaction, created_by: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createGroupWallet(name) {
  const { data, error } = await supabase.rpc('create_group_wallet', { p_name: name });
  if (error) throw error;
  return data;
}

export async function joinGroupWallet(inviteCode) {
  const { data, error } = await supabase.rpc('join_group_wallet', { p_invite_code: inviteCode });
  if (error) throw error;
  return data;
}

export async function recordAutoRenewConsent() {
  const { error } = await supabase.rpc('record_auto_renew_consent', { p_terms_version: 'paisatrack-2026-01' });
  if (error) throw error;
}

export async function requestSubscriptionCancellation() {
  const { error } = await supabase.rpc('request_subscription_cancellation');
  if (error) throw error;
}

export async function hasSubscriptionAccess() {
  const { data, error } = await supabase.rpc('has_subscription_access');
  if (error) throw error;
  return Boolean(data);
}
