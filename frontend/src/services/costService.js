import { supabase } from "../client";

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id;
}

/* ---------- Fixed Costs ---------- */
export async function fetchFixedCosts() {
  const owner_id = await getUserId();
  const { data, error } = await supabase
    .from("fixed_costs")
    .select("*")
    .eq("owner_id", owner_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createFixedCost(payload) {
  const owner_id = await getUserId();
  const { data, error } = await supabase
    .from("fixed_costs")
    .insert([{ owner_id, ...payload }])
    .select()
    .single();

  if (error) throw error;
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

  if (error) throw error;
  return data;
}

export async function deleteFixedCost(id) {
  const owner_id = await getUserId();
  const { error } = await supabase
    .from("fixed_costs")
    .delete()
    .eq("id", id)
    .eq("owner_id", owner_id);

  if (error) throw error;
}

/* ---------- Variable Components ---------- */
export async function fetchVariableComponents() {
  const owner_id = await getUserId();
  const { data, error } = await supabase
    .from("variable_components")
    .select("*")
    .eq("owner_id", owner_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createVariableComponent(payload) {
  const owner_id = await getUserId();
  const { data, error } = await supabase
    .from("variable_components")
    .insert([{ owner_id, ...payload }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVariableComponent(id, payload) {
  const owner_id = await getUserId();
  const { data, error } = await supabase
    .from("variable_components")
    .update(payload)
    .eq("id", id)
    .eq("owner_id", owner_id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVariableComponent(id) {
  const owner_id = await getUserId();
  const { error } = await supabase
    .from("variable_components")
    .delete()
    .eq("id", id)
    .eq("owner_id", owner_id);

  if (error) throw error;
}
