import { supabaseAdmin } from "../config/supabase.js";

const TABLE = "sales_data";

export async function upsertSalesData(userId, parsedRows) {
  // Remove old record for this user first, then insert fresh
  await supabaseAdmin.from(TABLE).delete().eq("user_id", userId);

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert([{ user_id: userId, data: parsedRows }])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}