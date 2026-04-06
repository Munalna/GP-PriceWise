import { supabaseAdmin } from "../config/supabase.js";

const TABLE = "sales_data";

export async function insertSalesData(userId, payload) {
  const row = {
    user_id: userId,
    data: payload.data ?? [],
    visual_summary: payload.visual_summary ?? {},
  };

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert([row])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}