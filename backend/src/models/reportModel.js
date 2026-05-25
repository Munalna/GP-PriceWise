import { supabaseAdmin } from "../config/supabase.js";
import { isMarketNameMatch } from "../utils/marketMatching.js";

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

export async function getCategoriesWithProductsByUser(userId) {
  const { data: categories, error } = await supabaseAdmin
    .from("categories")
    .select("*, products(*)")
    .eq("user_id", userId);

  if (error) throw error;

  // Fetch variable components to look up cost by name
  const { data: variableComponents } = await supabaseAdmin
    .from("components")
    .select("*")
    .eq("user_id", userId);

  // Build lookup map by name (lowercase)
  const vcMap = {};
  (variableComponents || []).forEach((vc) => {
    const key = vc.name?.trim().toLowerCase();
    if (key) vcMap[key] = vc;
  });

  // Fetch both market datasets
  const [res1, res2] = await Promise.all([
    supabaseAdmin.from("marketdataset").select("itemname, price"),
    supabaseAdmin.from("market_dataset").select("product_name, price"),
  ]);

  const marketData1 = res1.data || [];
  const marketData2 = res2.data || [];

  const enriched = (categories || []).map((cat) => ({
    ...cat,
    products: (cat.products || []).map((prod) => {

      // ── Parse components JSON string ──────────────────────
      let componentsList = [];
      try {
        componentsList = JSON.parse(prod.components || "[]");
      } catch {
        componentsList = [];
      }

      // ── Calculate variable cost by name lookup ────────────
      const variableCost = componentsList.reduce((sum, comp) => {
        const key = comp.name?.trim().toLowerCase();
        const vc = vcMap[key];
        if (!vc) return sum;
        const unitCost = Number(vc.cost_per_unit ?? 0);
        const qty = Number(comp.qty ?? 1);
        return sum + unitCost * qty;
      }, 0);

      // ── Avg competitor price from market datasets ─────────
      const prices1 = marketData1
        .filter((i) => i.itemname && isMarketNameMatch(i.itemname, prod.name))
        .map((i) => Number(i.price))
        .filter((price) => Number.isFinite(price));

      const prices2 = marketData2
        .filter(
          (i) => i.product_name && isMarketNameMatch(i.product_name, prod.name)
        )
        .map((i) => Number(i.price))
        .filter((price) => Number.isFinite(price));

      const allPrices = [...prices1, ...prices2];
      const avgCompetitorPrice =
        allPrices.length > 0
          ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length
          : 0;

      return {
        ...prod,
        variable_cost: variableCost,
        avg_competitor_price: avgCompetitorPrice,
      };
    }),
  }));

  return enriched;
}

export async function getFixedCostsByUser(userId) {
  const { data, error } = await supabaseAdmin
    .from("fixed_costs")
    .select("*")
    .eq("owner_id", userId);

  if (error) throw error;
  return data || [];
}

export async function getActiveSeasonsByUser(userId) {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabaseAdmin
    .from("seasons")
    .select("*")
    .eq("user_id", userId)
    .lte("start_date", today)
    .gte("end_date", today);

  if (error) throw error;
  return data || [];
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
