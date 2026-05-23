import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash";

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in backend .env file.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.2,
    },
  });
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini response did not contain valid JSON.");
    return JSON.parse(match[0]);
  }
}

export async function generateAIPriceRecommendation(productInput, riskAnalysis) {
  const model = getGeminiModel();

  const prompt = `
You are PriceWise AI, an intelligent pricing recommendation engine for Saudi cafes and restaurants.
Your task is to calculate a realistic recommended selling price in SAR for a product.

Business goal:
Generate a price that is:
- profitable,
- competitive in the Saudi market,
- aligned with assigned pricing rules,
- adjusted for active seasonal demand,
- reasonable for restaurant customers.

Cost definitions:
  component_cost = ingredient/recipe cost only.
  fixed_cost_share = allocated fixed cost per sold unit.
  base_cost = component_cost + fixed_cost_share.
  pricing_cost is the same value as base_cost and is included for compatibility.
  If fixed_cost_share is 0, fixed cost allocation was not applied.
  Your job is to ensure recommended_price never falls below:
  price_floor = base_cost / (1 - minimum_margin%)

Pricing steps (follow in order):
  1) base_cost = component_cost + fixed_cost_share
  2) price_floor = base_cost / (1 - minimum_margin%)
  3) start from max(price_floor, competitor_average_price)
  4) apply profit_margin rule if assigned
  5) apply seasonal adjustment if season is active
  6) apply maximum_price ceiling if assigned
  7) apply rounding rule last

Strict pricing logic:
1) Never recommend a price below price_floor.
2) competitor_average_price is a strong market signal; respect it.
3) If competitor_average_price is 0, rely on price_floor + pricing rules only.
4) Respect assigned pricing rules in priority order.
5) Final recommendation must be practical, not mathematically extreme.
6) Avoid unrealistic jumps (example: 12 SAR -> 48 SAR).
7) Recommended price should make business sense.

Pricing rule meanings:
- minimum_margin = minimum required margin % (covers fixed costs + minimum profit)
- profit_margin = target profit margin % above base_cost
- maximum_price = highest allowed selling price in SAR
- rounding = round final price (example: nearest 0.5 / 1 SAR)

Rule priority:
1. Product rules override everything
2. Category rules apply next
3. Season rules apply if season is active
4. Apply rounding near final step
5. Apply maximum_price ceiling last

Season behavior:
- High demand seasons (Ramadan, Holidays, Winter) can support slightly stronger pricing.
- Medium demand seasons should keep pricing balanced.
- Low/unknown demand seasons should use conservative pricing.

Decision reasoning:
Determine whether the business should:
- increase price
- decrease price
- maintain price

Product data:
${JSON.stringify(
  {
    product_name: productInput.product_name,
    category: productInput.category,
    current_price: productInput.current_price,
    component_cost: productInput.component_cost,
    fixed_cost_share: productInput.fixed_cost_share,
    base_cost: productInput.pricing_cost,
    pricing_cost: productInput.pricing_cost,
    minimum_margin: productInput.minimum_margin,
    competitor_average_price: productInput.competitor_average_price,
    market_average_price: productInput.market_average_price,
    min_market_price: productInput.min_market_price,
    max_market_price: productInput.max_market_price,
    active_season: productInput.active_season || null,
    season_name: productInput.season,
    product_rules: productInput.product_rules || [],
    category_rules: productInput.category_rules || [],
    season_rules: productInput.season_rules || [],
    fixed_cost_allocation: productInput.fixed_cost_allocation,
    risk_analysis: riskAnalysis,
  },
  null,
  2
)}

Return ONLY valid JSON, exactly this shape:
{
  "price_floor": 0,
  "recommended_price": 0,
  "recommendation_type": "increase | decrease | maintain",
  "reason": "short clear reason",
  "risk_explanation": "why the price is risky or not risky",
  "margin_safety_explanation": "explain whether margin is safe above price_floor",
  "action": "what the owner should do next"
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = extractJson(text);

  return {
    price_floor: Number(parsed.price_floor) || 0,
    recommended_price: Number(parsed.recommended_price) || 0,
    recommendation_type: parsed.recommendation_type || "maintain",
    reason: parsed.reason || "",
    risk_explanation: parsed.risk_explanation || "",
    margin_safety_explanation: parsed.margin_safety_explanation || "",
    action: parsed.action || "",
    model: MODEL_NAME,
  };
}
