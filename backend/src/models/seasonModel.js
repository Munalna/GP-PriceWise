import { supabaseAdmin } from "../config/supabase.js";

const TABLE = "seasons";

function computeIsActive(startDate, endDate) {
  const today = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return today >= start && today <= end;
}

export async function getSeasonsByUser(userId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createSeason(userId, payload) {
  const row = {
    user_id: userId,
    season_name: payload.name,
    start_date: payload.startDate,
    end_date: payload.endDate,
    is_active: computeIsActive(payload.startDate, payload.endDate),
  };

  console.log("INSERT ROW:", row);

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert([row])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateSeason(userId, id, payload) {
  const patch = {};

  if (payload.name !== undefined) patch.season_name = payload.name;
  if (payload.startDate !== undefined) patch.start_date = payload.startDate;
  if (payload.endDate !== undefined) patch.end_date = payload.endDate;

  if (patch.start_date || patch.end_date) {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from(TABLE)
      .select("start_date, end_date")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError) throw fetchError;
    if (!existing) return null;

    const finalStartDate = patch.start_date ?? existing.start_date;
    const finalEndDate = patch.end_date ?? existing.end_date;

    patch.is_active = computeIsActive(finalStartDate, finalEndDate);
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteSeason(userId, id) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return !!data;
}