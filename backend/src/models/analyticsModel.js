import { supabaseAdmin } from "../config/supabase.js";

const SALES_TABLE = "sales_data";

export async function getLatestVisualSummaryByUser(userId) {
  const { data, error } = await supabaseAdmin
    .from(SALES_TABLE)
    .select("id, user_id, visual_summary, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}