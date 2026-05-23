import { supabaseAdmin } from "../config/supabase.js";

const SALES_TABLE = "sales_data";
const PRODUCTS_TABLE = "products";
const PRODUCT_COMPONENTS_TABLE = "product_components";
const MARKET_TABLE = "marketdataset";
const PRICING_RULE_ASSIGNMENTS_TABLE = "pricing_rule_assignments";
const SEASONS_TABLE = "seasons";
const FIXED_COSTS_TABLE = "fixed_costs";

export async function checkProductInMarketDataset(productName) {
  const db = getDbClient();

  const normalizedName = productName.trim().toLowerCase();

  const { data, error } = await db
    .from("marketdataset")
    .select("itemname, price")
    .limit(100);

  if (error) throw error;

  const matches = (data || []).filter((row) => {
    const itemName = String(row.itemname || "").trim().toLowerCase();
    return itemName === normalizedName;
  });

  return {
    exists: matches.length > 0,
    matches,
  };
}

function getDbClient() {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured.");
  }

  return supabaseAdmin;
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function getAverage(numbers = []) {
  const validNumbers = numbers
    .map((num) => Number(num))
    .filter((num) => Number.isFinite(num));

  if (validNumbers.length === 0) return 0;

  const total = validNumbers.reduce((sum, num) => sum + num, 0);
  return total / validNumbers.length;
}

function getMonthlyFixedCostAmount(cost) {
  const amount = toNumber(cost?.amount, 0);
  const period = String(cost?.period || "Monthly").trim().toLowerCase();

  if (period === "quarterly") return amount / 3;
  if (period === "yearly") return amount / 12;

  return amount;
}

function getInclusiveDateSpanDays(rows = []) {
  const timestamps = rows
    .map((row) => {
      const date = row?.sale_date ? new Date(row.sale_date) : null;
      return date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
    })
    .filter((timestamp) => timestamp !== null);

  if (timestamps.length === 0) return 0;

  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const dayMs = 24 * 60 * 60 * 1000;

  return Math.max(1, Math.round((maxTime - minTime) / dayMs) + 1);
}

function parseJsonArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getAverageFromCompetitorsPrices(competitorsPrices) {
  const prices = parseJsonArray(competitorsPrices)
    .map((item) => {
      if (typeof item === "number") return item;
      if (typeof item === "string") return Number(item);
      if (typeof item === "object" && item !== null) {
        const candidates = [
          item.price,
          item.value,
          item.competitor_price,
          item.amount,
          item.cost,
          item.competitorPrice,
          item.competitor,
        ];
        for (const candidate of candidates) {
          const num = Number(candidate);
          if (Number.isFinite(num) && num > 0) return num;
        }
      }
      return 0;
    })
    .filter((price) => Number.isFinite(price) && price > 0);

  return getAverage(prices);
}

async function getVariableComponentsCostFromProductText(userId, productComponentsText) {
  const db = getDbClient();

  const parsedComponents = parseJsonArray(productComponentsText);

  if (parsedComponents.length === 0) {
    return {
      components: [],
      total_component_cost: 0,
    };
  }

  const { data, error } = await db
    .from("variable_components")
    .select("id, name, cost_per_unit, unit")
    .eq("owner_id", userId);

  if (error) throw error;

  const variableComponents = data || [];

  const total = parsedComponents.reduce((sum, item) => {
    const componentName = item.name;
    const quantity = toNumber(item.qty ?? item.quantity, 0);

    const dbComponent = variableComponents.find(
      (component) =>
        String(component.name).toLowerCase().trim() ===
        String(componentName).toLowerCase().trim()
    );

    const unitCost = toNumber(dbComponent?.cost_per_unit, 0);

    return sum + quantity * unitCost;
  }, 0);

  return {
    components: parsedComponents,
    total_component_cost: total,
  };
}

export async function getLatestVisualSummaryByUser(userId) {
  const db = getDbClient();

  const { data, error } = await db
    .from(SALES_TABLE)
    .select("id, user_id, visual_summary, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getProductById(userId, productId) {
  const db = getDbClient();

  const { data, error } = await db
    .from(PRODUCTS_TABLE)
    .select(
      `
      id,
      user_id,
      name,
      category_id,
      components,
      c_price,
      comp_price,
      b_cost,
      competitors_prices,
      categories (
        id,
        name
      )
    `
    )
    .eq("user_id", userId)
    .eq("id", productId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAllProductsByUser(userId) {
  const db = getDbClient();

  const { data, error } = await db
    .from(PRODUCTS_TABLE)
    .select(
      `
      id,
      user_id,
      name,
      category_id,
      c_price,
      comp_price,
      b_cost,
      competitors_prices,
      created_at,
      categories (
        id,
        name
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProductComponentsCost(productId) {
  const db = getDbClient();

  const { data, error } = await db
    .from(PRODUCT_COMPONENTS_TABLE)
    .select(
      `
      id,
      product_id,
      component_id,
      quantity,
      components (
        id,
        name,
        cost
      )
    `
    )
    .eq("product_id", productId);

  if (error) throw error;

  const components = data || [];

  const totalComponentCost = components.reduce((sum, item) => {
    const quantity = toNumber(item.quantity, 0);
    const componentCost = toNumber(item.components?.cost, 0);
    return sum + quantity * componentCost;
  }, 0);

  return {
    components,
    total_component_cost: totalComponentCost,
  };
}

export async function getMarketPricesByProductName(productName, categoryName) {
  const db = getDbClient();

  let query = db
    .from(MARKET_TABLE)
    .select(
      "productid, restaurantname, location, itemname, category, price, source, scrapedat"
    )
    .ilike("itemname", `%${productName}%`);

  if (categoryName && categoryName !== "Unknown") {
    query = query.ilike("category", `%${categoryName}%`);
  }

  const { data, error } = await query.limit(30);

  if (error) throw error;

  const marketRows = data || [];
  const prices = marketRows
    .map((row) => toNumber(row.price, 0))
    .filter((price) => price > 0);

  return {
    market_rows: marketRows,
    average_market_price: getAverage(prices),
    min_market_price: prices.length ? Math.min(...prices) : 0,
    max_market_price: prices.length ? Math.max(...prices) : 0,
    market_sample_size: prices.length,
  };
}

export async function getAssignedPricingRules(userId, productId, categoryId) {
  const db = getDbClient();

  const targetFilters = [`and(target_type.eq.product,target_id.eq.${productId})`];

  if (categoryId) {
    targetFilters.push(`and(target_type.eq.category,target_id.eq.${categoryId})`);
  }

  const { data, error } = await db
    .from(PRICING_RULE_ASSIGNMENTS_TABLE)
    .select(
      `
      id,
      user_id,
      rule_id,
      target_type,
      target_id,
      pricing_rules (
        id,
        name,
        type,
        value
      )
    `
    )
    .eq("user_id", userId)
    .or(targetFilters.join(","));

  if (error) throw error;

  return data || [];
}

export async function getActiveSeason(userId) {
  const db = getDbClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await db
    .from(SEASONS_TABLE)
    .select("id, season_name, start_date, end_date, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getSeasonPricingRules(userId, seasonId) {
  if (!seasonId) return [];

  const db = getDbClient();

  const { data, error } = await db
    .from(PRICING_RULE_ASSIGNMENTS_TABLE)
    .select(`
      id,
      user_id,
      rule_id,
      target_type,
      target_id,
      pricing_rules (
        id,
        name,
        type,
        value
      )
    `)
    .eq("user_id", userId)
    .eq("target_type", "season")
    .eq("target_id", seasonId);

  if (error) throw error;
  return data || [];
}

export async function getFixedCostAllocationContext(userId) {
  const db = getDbClient();

  const [fixedCostsResult, salesResult] = await Promise.all([
    db
      .from(FIXED_COSTS_TABLE)
      .select("amount, period")
      .eq("owner_id", userId),
    db
      .from(SALES_TABLE)
      .select("quantity, sale_date")
      .eq("user_id", userId),
  ]);

  if (fixedCostsResult.error) throw fixedCostsResult.error;
  if (salesResult.error) throw salesResult.error;

  const fixedCosts = fixedCostsResult.data || [];
  const salesRows = salesResult.data || [];

  const totalMonthlyFixedCosts = fixedCosts.reduce(
    (sum, cost) => sum + getMonthlyFixedCostAmount(cost),
    0
  );

  const totalUnitsInImport = salesRows.reduce(
    (sum, row) => sum + toNumber(row.quantity, 0),
    0
  );

  const salesPeriodDays = getInclusiveDateSpanDays(salesRows);
  const estimatedMonthlyUnits =
    totalUnitsInImport > 0 && salesPeriodDays > 0
      ? totalUnitsInImport * (30 / salesPeriodDays)
      : 0;

  const fixedCostShare =
    totalMonthlyFixedCosts > 0 && estimatedMonthlyUnits > 0
      ? totalMonthlyFixedCosts / estimatedMonthlyUnits
      : 0;

  return {
    total_monthly_fixed_costs: Number(totalMonthlyFixedCosts.toFixed(2)),
    sales_units_in_import: Number(totalUnitsInImport.toFixed(2)),
    sales_period_days: salesPeriodDays,
    estimated_monthly_units: Number(estimatedMonthlyUnits.toFixed(2)),
    fixed_cost_share_per_unit: Number(fixedCostShare.toFixed(2)),
    fixed_cost_allocation_applied:
      totalMonthlyFixedCosts > 0 && estimatedMonthlyUnits > 0,
  };
}

export async function buildProductPricingAnalysisInput(userId, productId) {
  const product = await getProductById(userId, productId);

  if (!product) return null;

  const categoryName = product.categories?.name || "Unknown";

  const [
    componentCostFromRelation,
    componentCostFromText,
    marketResult,
    assignedRules,
    activeSeason,
    fixedCostAllocation,
  ] = await Promise.all([
    getProductComponentsCost(product.id),
    getVariableComponentsCostFromProductText(userId, product.components),
    getMarketPricesByProductName(product.name, categoryName),
    getAssignedPricingRules(userId, product.id, product.category_id),
    getActiveSeason(userId),
    getFixedCostAllocationContext(userId),
  ]);

  const seasonRules = await getSeasonPricingRules(userId, activeSeason?.id);

  const productRules = assignedRules
    .filter((a) => a.target_type === "product")
    .map((a) => a.pricing_rules)
    .filter(Boolean);

  const categoryRules = assignedRules
    .filter((a) => a.target_type === "category")
    .map((a) => a.pricing_rules)
    .filter(Boolean);

  const activeSeasonRules = seasonRules
    .map((a) => a.pricing_rules)
    .filter(Boolean);

  const allRules = [...productRules, ...categoryRules, ...activeSeasonRules];

  const minimumMarginRule = allRules.find(
    (rule) => String(rule?.type || "").toLowerCase() === "minimum margin"
  );

  const targetMarginRule = allRules.find((rule) =>
    ["minimum margin", "profit margin"].includes(
      String(rule?.type || "").toLowerCase()
    )
  );

  const componentCostResult =
    componentCostFromRelation.total_component_cost > 0
      ? componentCostFromRelation
      : componentCostFromText;

  const totalComponentCost = toNumber(componentCostResult.total_component_cost, 0);
  const storedBaseCost = toNumber(product.b_cost, 0);
  const baseCost = totalComponentCost;
  const fixedCostShare = toNumber(
    fixedCostAllocation.fixed_cost_share_per_unit,
    0
  );
  const pricingCost = baseCost + fixedCostShare;
  const currentPrice = toNumber(product.c_price, 0);

  const competitorFromMarket = toNumber(marketResult.average_market_price, 0);
  const competitorFromList = getAverageFromCompetitorsPrices(product.competitors_prices);
  const competitorFromProduct = toNumber(product.comp_price, 0);

 const competitorAveragePrice =
  competitorFromList > 0
    ? competitorFromList
    : competitorFromMarket > 0
    ? competitorFromMarket
    : competitorFromProduct > 0
    ? competitorFromProduct
    : 0;

  return {
    id: product.id,
    product_id: product.id,
    product_name: product.name,
    name: product.name,
    category: categoryName,
    category_id: product.category_id,

    current_price: currentPrice,
    base_cost: baseCost,
    component_cost: totalComponentCost,
    fixed_cost_share: fixedCostShare,
    pricing_cost: pricingCost,
    stored_base_cost: storedBaseCost,

    competitor_average_price: competitorAveragePrice,
    market_average_price: competitorFromMarket,
    stored_competitor_price: competitorFromProduct,
    min_market_price: marketResult.min_market_price,
    max_market_price: marketResult.max_market_price,
    market_sample_size: marketResult.market_sample_size,

    target_margin: targetMarginRule
      ? toNumber(targetMarginRule.value, null)
      : null,
    minimum_margin: minimumMarginRule
      ? toNumber(minimumMarginRule.value, 0)
      : 0,

    season: activeSeason?.season_name || "Unknown",
    active_season: activeSeason || null,

    product_rules: productRules,
    category_rules: categoryRules,
    season_rules: activeSeasonRules,

    fixed_variable_cost_ratio: 0,
    fixed_cost_allocation: fixedCostAllocation,

    components: componentCostResult.components,
    market_rows: marketResult.market_rows,

    pricing_rules: {
      product_rules: productRules,
      category_rules: categoryRules,
      season_rules: activeSeasonRules,
    },
  };
}

export async function buildAllProductsPricingAnalysisInput(userId) {
  const products = await getAllProductsByUser(userId);

  const results = await Promise.all(
    products.map((product) => buildProductPricingAnalysisInput(userId, product.id))
  );

  return results.filter(Boolean);
}
