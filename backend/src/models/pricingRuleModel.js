import { supabaseAdmin } from "../config/supabase.js";

const TABLE = "pricing_rules";

function normalizeRuleType(ruleType) {
  return String(ruleType || "").trim().toLowerCase();
}

function ensureSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error("supabaseAdmin is not initialized");
  }
  return supabaseAdmin;
}

export async function getPricingRulesByUser(userId) {
  const client = ensureSupabaseAdmin();

  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPricingRuleById(userId, id) {
  const client = ensureSupabaseAdmin();

  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getPricingRuleByName(userId, name) {
  const client = ensureSupabaseAdmin();

  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .ilike("name", name)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createPricingRule(userId, payload) {
  const client = ensureSupabaseAdmin();

  const row = {
    user_id: userId,
    name: payload.name,
    type: normalizeRuleType(payload.type),
    value: payload.value,
  };

  const { data, error } = await client
    .from(TABLE)
    .insert([row])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updatePricingRule(userId, id, payload) {
  const client = ensureSupabaseAdmin();
  const patch = {};

  if (payload.name !== undefined) patch.name = payload.name;
  if (payload.type !== undefined) patch.type = normalizeRuleType(payload.type);
  if (payload.value !== undefined) patch.value = payload.value;

  const { data, error } = await client
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deletePricingRule(userId, id) {
  const client = ensureSupabaseAdmin();

  const { data, error } = await client
    .from(TABLE)
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return !!data;
}