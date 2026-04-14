import { supabaseAdmin } from "../config/supabase.js";

const SALES_TABLE = "sales_data";

export async function getLatestSalesDataByUser(userId) {
  const { data, error } = await supabaseAdmin
    .from(SALES_TABLE)
    .select("id, user_id, data, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getProductsByUser(userId) {
  const { data: categories, error } = await supabaseAdmin
    .from("categories")
    .select("*, products(*)")
    .eq("user_id", userId);

  if (error) throw error;

  // Flatten all products from all categories
  const products = (categories || []).flatMap((cat) =>
    (cat.products || []).map((prod) => ({
      name: prod.name,
      cost: prod.b_cost ?? 0,
      competitor_price: prod.comp_price ?? 0,
    }))
  );

  return products;
}

export async function logExportReport(userId, format) {
  const { data, error } = await supabaseAdmin
    .from("reports")
    .insert([{ user_id: userId, format }])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}