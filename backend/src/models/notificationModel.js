import { supabaseAdmin } from "../config/supabase.js";

const TABLE = "notifications";

export async function createNotification({ user_id, type, title, message, season_id }) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert([
      {
        user_id,
        type,
        title,
        message,
        season_id,
      },
    ])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}