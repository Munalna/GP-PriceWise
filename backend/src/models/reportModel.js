import { supabaseAdmin } from "../config/supabase.js";

const SALES_TABLE = "sales_data";
const REPORTS_TABLE = "reports";

export async function getLatestSalesDataByUser(userId) {
  const { data, error } = await supabaseAdmin
    .from(SALES_TABLE)
    .select("id, user_id, data, visual_summary, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function logExportReport(userId, format) {
  const { data, error } = await supabaseAdmin
    .from(REPORTS_TABLE)
    .insert([
      {
        user_id: userId,
        format,
      },
    ])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}