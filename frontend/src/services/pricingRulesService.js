import { supabase } from "../client";

async function getUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error("Not authenticated");
  return data.user.id;
}

// ---------- Rules CRUD ----------
export async function fetchPricingRules() {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("pricing_rules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createPricingRule(payload) {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("pricing_rules")
    .insert([{ ...payload, user_id: userId }])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updatePricingRule(id, payload) {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("pricing_rules")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deletePricingRule(id) {
  const userId = await getUserId();

  const { error } = await supabase
    .from("pricing_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
  return true;
}

// ---------- Assignments ----------
export async function fetchRuleAssignments(ruleId) {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("pricing_rule_assignments")
    .select("*")
    .eq("user_id", userId)
    .eq("rule_id", ruleId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addRuleAssignment(ruleId, target_type, target_id) {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("pricing_rule_assignments")
    .insert([{ user_id: userId, rule_id: ruleId, target_type, target_id }])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRuleAssignment(assignmentId) {
  const userId = await getUserId();

  const { error } = await supabase
    .from("pricing_rule_assignments")
    .delete()
    .eq("id", assignmentId)
    .eq("user_id", userId);

  if (error) throw error;
  return true;
}