import { GoogleGenerativeAI } from "@google/generative-ai";

//const MODEL_NAME = "gemini-2.0-flash";

const MODEL_NAME = "gemini-2.5-flash";
//const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
   // maxOutputTokens: 350,  //مدري احذفهم ولا
    //responseMimeType: "application/json",
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
You are PriceWise AI, an intelligent pricing recommendation engine for Saudi cafés and restaurants.

Your task is to calculate a realistic recommended selling price in SAR for a product.

Business goal:
Generate a price that is:
- profitable,
- competitive in the Saudi market,
- aligned with assigned pricing rules,
- adjusted for active seasonal demand,
- reasonable for restaurant customers.

Strict pricing logic:
1) Never recommend a price below total cost.
2) Always ensure healthy profit margin.
3) Consider competitor average price strongly when available.
4) If competitor average is missing (0), rely on cost + pricing rules.
5) Respect assigned pricing rules.
6) Respect active seasonal rules.
7) Final recommendation must be practical, not mathematically extreme.
8) Avoid unrealistic jumps (example: 12 SAR → 48 SAR).
9) Recommended price should make business sense.

Pricing rule meanings:
- minimum margin = minimum required margin %
- profit margin = target profit margin %
- maximum price = highest allowed selling price in SAR
- rounding = round final price (example: nearest 0.5 / 1 SAR)

Rule priority:
1. Product rules override everything
2. Category rules apply next
3. Season rules apply if season is active
4. Apply rounding near final step
5. Apply maximum price ceiling last

Season behavior:
- High demand seasons (Ramadan, Holidays, Winter) can support slightly stronger pricing.
- Medium demand seasons should keep pricing balanced.
- Low/unknown demand seasons should use conservative pricing.

Use all provided inputs:
- current price
- base cost
- component cost
- competitor average
- market range
- assigned rules
- active season
- risk analysis

Decision reasoning:
Determine whether the business should:
- increase price
- decrease price
- maintain price

Return ONLY valid JSON.

Return exactly:
{
  "recommended_price": 0,
  "recommendation_type": "increase | decrease | maintain",
  "reason": "short business reason",
  "risk_explanation": "pricing risk explanation",
  "margin_safety_explanation": "margin explanation",
  "action": "clear recommended business action"
}

Product data:
${JSON.stringify(
  {
    product_name: productInput.product_name,
    category: productInput.category,
    current_price: productInput.current_price,
    base_cost: productInput.base_cost,
    component_cost: productInput.component_cost,

    competitor_average_price: productInput.competitor_average_price,
    market_average_price: productInput.market_average_price,
    min_market_price: productInput.min_market_price,
    max_market_price: productInput.max_market_price,

    target_margin: productInput.target_margin,

    active_season: productInput.active_season || null,
    season_name: productInput.season,

    product_rules: productInput.product_rules || [],
    category_rules: productInput.category_rules || [],
    season_rules: productInput.season_rules || [],

    risk_analysis: riskAnalysis,
  },
  null,
  2
)}

Return this exact JSON shape:
{
  "recommended_price": 0,
  "recommendation_type": "increase | decrease | maintain",
  "reason": "short clear reason",
  "risk_explanation": "why the price is risky or not risky",
  "margin_safety_explanation": "explain whether margin is safe",
  "action": "what the owner should do next"
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const parsed = extractJson(text);

  return {
    recommended_price: Number(parsed.recommended_price) || 0,
    recommendation_type: parsed.recommendation_type || "maintain",
    reason: parsed.reason || "",
    risk_explanation: parsed.risk_explanation || "",
    margin_safety_explanation: parsed.margin_safety_explanation || "",
    action: parsed.action || "",
    model: MODEL_NAME,
  };
}