import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash";

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in backend .env file.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: MODEL_NAME });
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
You are an intelligent pricing assistant for PriceWise, a Saudi café and restaurant pricing platform.

Use the provided product data to suggest a realistic recommended selling price in SAR.

Important rules:
- Return ONLY valid JSON.
- Do not return markdown.
- Do not invent missing data.
- The recommended price must be profitable.
- Consider current price, base cost, competitor average, pricing rules, season, and risk analysis.
- If competitor average is 0, rely more on cost and margin.
- Recommended price should be practical for cafés/restaurants in Saudi Arabia.

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
    season: productInput.season,
    pricing_rules: productInput.pricing_rules,
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