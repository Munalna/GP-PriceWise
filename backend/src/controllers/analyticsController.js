import {
  getLatestVisualSummaryByUser,
  buildProductPricingAnalysisInput,
  buildAllProductsPricingAnalysisInput,
} from "../models/analyticsModel.js";

import {
  analyzeProductRisk,
  analyzeMultipleProductsRisk,
  buildRiskSummary,
} from "../services/riskAnalysisService.js";

import { generateAIPriceRecommendation } from "../services/aiPricingService.js";

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
        },
        season: productInput.season,
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

  aiRecommendation = {
    recommended_price:
      productInput.competitor_average_price > 0
        ? productInput.competitor_average_price
        : productInput.current_price,
    recommendation_type: "maintain",
    reason:
      "AI recommendation is currently unavailable due to Gemini quota limits. A fallback recommendation was generated using available pricing data.",
    risk_explanation: analysis.short_reason,
    margin_safety_explanation: `Current margin is ${analysis.applied_margin}%.`,
    action: analysis.recommendation,
    model: "fallback_rule_based",
  };
}

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