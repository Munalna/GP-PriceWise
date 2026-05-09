import {
  getLatestVisualSummaryByUser,
  buildProductPricingAnalysisInput,
  buildAllProductsPricingAnalysisInput,
  checkProductInMarketDataset,
} from "../models/analyticsModel.js";

import {
  analyzeProductRisk,
  analyzeMultipleProductsRisk,
  buildRiskSummary,
} from "../services/riskAnalysisService.js";

import { generateAIPriceRecommendation } from "../services/aiPricingService.js";

import { updateRecommendedPriceById } from "../models/productModel.js";

export async function getAnalytics(req, res, next) {
  try {
    const userId = req.user.id;

    const salesRecord = await getLatestVisualSummaryByUser(userId);

    if (!salesRecord || !salesRecord.visual_summary) {
      return res.json({
        top_products: [],
        low_products: [],
        profit: 0,
      });
    }

    const summary = salesRecord.visual_summary;

    return res.json({
      top_products: Array.isArray(summary.top_products) ? summary.top_products : [],
      low_products: Array.isArray(summary.low_products) ? summary.low_products : [],
      profit: summary.profit ?? 0,
    });
  } catch (error) {
    next(error);
  }
}

export async function checkMarketProduct(req, res, next) {
  try {
    const { name } = req.query;

    if (!name || name.trim().length < 2) {
      return res.json({
        success: true,
        exists: false,
        matches: [],
      });
    }

    const result = await checkProductInMarketDataset(name.trim());

    return res.json({
      success: true,
      exists: result.exists,
      matches: result.matches,
    });
  } catch (error) {
    next(error);
  }
}
export async function analyzeSingleProduct(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const productInput = await buildProductPricingAnalysisInput(userId, productId);

    if (!productInput) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const analysis = await analyzeProductRisk(productInput);

    return res.json({
      success: true,
      data: {
        product: {
          id: productInput.product_id,
          name: productInput.product_name,
          category: productInput.category,
          current_price: productInput.current_price,
        },
        cost: {
          base_cost: productInput.base_cost,
          component_cost: productInput.component_cost,
          stored_base_cost: productInput.stored_base_cost,
        },
        market: {
          competitor_average_price: productInput.competitor_average_price,
          market_average_price: productInput.market_average_price,
          min_market_price: productInput.min_market_price,
          max_market_price: productInput.max_market_price,
          sample_size: productInput.market_sample_size,
        },
        rules: {
  target_margin: productInput.target_margin,
  product_rules: productInput.product_rules || [],
  category_rules: productInput.category_rules || [],
  season_rules: productInput.season_rules || [],
},
season: productInput.active_season || productInput.season,
        analysis,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPricingRiskSummary(req, res, next) {
  try {
    const userId = req.user.id;

    const productsInput = await buildAllProductsPricingAnalysisInput(userId);
    const analyses = await analyzeMultipleProductsRisk(productsInput);
    const summary = buildRiskSummary(analyses);

    return res.json({
      success: true,
      data: {
        summary,
        products: analyses,
      },
    });
  } catch (error) {
    next(error);
  }
}

function buildFallbackRecommendedPrice(productInput) {
  const baseCost = Number(productInput.base_cost) || 0;
  const competitorAverage = Number(productInput.competitor_average_price) || 0;
  const currentPrice = Number(productInput.current_price) || 0;

  let recommendedPrice;

  if (baseCost > 0 && competitorAverage > 0) {
    recommendedPrice = Math.max(baseCost * 1.3, competitorAverage);
  } else if (baseCost > 0) {
    recommendedPrice = baseCost * 1.35;
  } else if (competitorAverage > 0) {
    recommendedPrice = competitorAverage;
  } else {
    recommendedPrice = currentPrice;
  }

  return Number(recommendedPrice.toFixed(2));
}

export async function getAIPriceRecommendation(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const productInput = await buildProductPricingAnalysisInput(userId, productId);

    if (!productInput) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const analysis = await analyzeProductRisk(productInput);

    let aiRecommendation;

    try {
      aiRecommendation = await generateAIPriceRecommendation(productInput, analysis);
    } catch (aiError) {
      console.error("Gemini recommendation error:", aiError.message);

      const fallbackRecommendedPrice = buildFallbackRecommendedPrice(productInput);

      aiRecommendation = {
        recommended_price: fallbackRecommendedPrice,
        recommendation_type:
          fallbackRecommendedPrice > productInput.current_price
            ? "increase"
            : fallbackRecommendedPrice < productInput.current_price
            ? "decrease"
            : "maintain",
        reason:
          "Generated using product cost, competitor pricing, and available pricing rules.",
        risk_explanation: analysis.short_reason,
        margin_safety_explanation: `Current margin is ${analysis.applied_margin}%.`,
        action: analysis.recommendation,
        model: "fallback_rule_based",
      };
    }

    const marginRule =
  productInput.product_rules?.find((rule) =>
    ["minimum margin", "profit margin"].includes(String(rule.type).toLowerCase())
  ) ||
  productInput.category_rules?.find((rule) =>
    ["minimum margin", "profit margin"].includes(String(rule.type).toLowerCase())
  ) ||
  productInput.season_rules?.find((rule) =>
    ["minimum margin", "profit margin"].includes(String(rule.type).toLowerCase())
  );

const marginPercent = Number(marginRule?.value || 30);

const minimumSafePrice = Number(
  (productInput.base_cost * (1 + marginPercent / 100)).toFixed(2)
);

if (
  !aiRecommendation.recommended_price ||
  aiRecommendation.recommended_price < minimumSafePrice
) {
  aiRecommendation.recommended_price = minimumSafePrice;
  aiRecommendation.recommendation_type =
    minimumSafePrice > productInput.current_price ? "increase" : "maintain";
  aiRecommendation.reason =
    `Adjusted to protect at least ${marginPercent}% margin based on product cost.`;
}

    await updateRecommendedPriceById(
  productInput.product_id,
  userId,
  aiRecommendation.recommended_price
);

    return res.json({
      success: true,
      data: {
        product: {
          id: productInput.product_id,
          name: productInput.product_name,
          category: productInput.category,
          current_price: productInput.current_price,
        },
        cost: {
          base_cost: productInput.base_cost,
          component_cost: productInput.component_cost,
        },
        market: {
          competitor_average_price: productInput.competitor_average_price,
          market_average_price: productInput.market_average_price,
          min_market_price: productInput.min_market_price,
          max_market_price: productInput.max_market_price,
          sample_size: productInput.market_sample_size,
        },
        rules: {
          target_margin: productInput.target_margin,
        },
        season: productInput.season,
        analysis,
        ai: aiRecommendation,
      },
    });
  } catch (error) {
    next(error);
  }
}