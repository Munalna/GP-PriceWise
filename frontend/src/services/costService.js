import { supabase } from "../client";

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id;
}

function formatCostError(error, fallback) {
  if (error?.code === "23505") {
    return new Error(fallback);
  }

  return new Error(error?.message || fallback || "Something went wrong.");
}

/* ---------- Fixed Costs ---------- */
export async function fetchFixedCosts() {
  const owner_id = await getUserId();

  const { data, error } = await supabase
    .from("fixed_costs")
    .select("*")
    .eq("owner_id", owner_id)
    .order("created_at", { ascending: false });

  if (error) throw formatCostError(error, "Failed to load fixed costs.");
  return data;
}

export async function createFixedCost(payload) {
  const owner_id = await getUserId();

  const { data, error } = await supabase
    .from("fixed_costs")
    .insert([{ owner_id, ...payload }])
    .select()
    .single();

  if (error) throw formatCostError(error, "Fixed cost name already exists.");
  return data;
}

export async function updateFixedCost(id, payload) {
  const owner_id = await getUserId();

  const { data, error } = await supabase
    .from("fixed_costs")
    .update(payload)
    .eq("id", id)
    .eq("owner_id", owner_id)
    .select()
    .single();

  if (error) throw formatCostError(error, "Fixed cost name already exists.");
  return data;
}

export async function deleteFixedCost(id) {
  const owner_id = await getUserId();

  const { error } = await supabase
    .from("fixed_costs")
    .delete()
    .eq("id", id)
    .eq("owner_id", owner_id);

  if (error) throw formatCostError(error, "Failed to delete fixed cost.");
}

/* ---------- Variable Components ---------- */
export async function fetchVariableComponents() {
  const user_id = await getUserId();

  const { data, error } = await supabase
    .from("components")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) throw formatCostError(error, "Failed to load components.");
  return data;
}

export async function createVariableComponent(payload) {
  const user_id = await getUserId();

  const { data, error } = await supabase
    .from("components")
    .insert([{ user_id, ...payload }])
    .select()
    .single();

  if (error) throw formatCostError(error, "Component name already exists.");
  return data;
}

export async function updateVariableComponent(id, payload) {
  const user_id = await getUserId();

  const { data, error } = await supabase
    .from("components")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user_id)
    .select()
    .single();

  if (error) throw formatCostError(error, "Component name already exists.");
  return data;
}

export async function deleteVariableComponent(id) {
  const user_id = await getUserId();

  const { error } = await supabase
    .from("components")
    .delete()
    .eq("id", id)
    .eq("user_id", user_id);

  if (error) throw formatCostError(error, "Failed to delete component.");
}