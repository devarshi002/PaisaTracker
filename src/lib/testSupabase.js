import { supabase } from "./supabase";

export async function testSupabase() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Supabase error:", error.message);
    return;
  }

  console.log("Supabase connected successfully!");
  console.log("Current session:", data.session);
}