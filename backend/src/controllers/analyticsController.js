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
      top_products: Array.isArray(summary.top_products)
        ? summary.top_products
        : [],
      low_products: Array.isArray(summary.low_products)
        ? summary.low_products
        : [],
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

    const productInput = await buildProductPricingAnalysisInput(
      userId,
      productId
    );

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

/* -------------------------------------------------- */
/* Pricing Rule Helpers */
/* -------------------------------------------------- */

function normalizeRuleType(type) {
  return String(type || "").trim().toLowerCase();
}

function getAllAppliedRules(productInput) {
  return [
    ...(productInput.product_rules || []),
    ...(productInput.season_rules || []),
    ...(productInput.category_rules || []),
  ].filter(Boolean);
}

function findRuleByType(productInput, ruleType) {
  const normalizedType = normalizeRuleType(ruleType);

  /*
    Priority:
    1. Product rules  -> most specific
    2. Season rules   -> active seasonal context
    3. Category rules -> general category-level policy
  */
  return (
    (productInput.product_rules || []).find(
      (rule) => normalizeRuleType(rule.type) === normalizedType
    ) ||
    (productInput.season_rules || []).find(
      (rule) => normalizeRuleType(rule.type) === normalizedType
    ) ||
    (productInput.category_rules || []).find(
      (rule) => normalizeRuleType(rule.type) === normalizedType
    ) ||
    null
  );
}

function roundUpToPriceEnding(price, ending) {
  const numericPrice = Number(price);
  const numericEnding = Number(ending);

  if (!Number.isFinite(numericPrice)) return 0;

  if (numericEnding === 0) {
    return Number(Math.ceil(numericPrice).toFixed(2));
  }

  const wholeNumber = Math.floor(numericPrice);
  let roundedPrice = wholeNumber + numericEnding;

  if (roundedPrice < numericPrice) {
    roundedPrice = wholeNumber + 1 + numericEnding;
  }

  return Number(roundedPrice.toFixed(2));
}

function applyPricingRulesToRecommendation(productInput, initialPrice) {
  const baseCost = Number(productInput.base_cost) || 0;
  let finalPrice = Number(initialPrice) || 0;

  const appliedRules = [];

  const profitMarginRule = findRuleByType(productInput, "profit margin");
  const minimumMarginRule = findRuleByType(productInput, "minimum margin");
  const maximumPriceRule = findRuleByType(productInput, "maximum price");
  const roundingRule = findRuleByType(productInput, "rounding");

  /*
    Profit Margin Rule:
    If the current recommendation is lower than the target profit price,
    raise it to protect the intended profit.
  */
  if (profitMarginRule && baseCost > 0) {
    const marginPercent = Number(profitMarginRule.value);

    if (Number.isFinite(marginPercent) && marginPercent > 0) {
      const profitPrice = Number(
        (baseCost * (1 + marginPercent / 100)).toFixed(2)
      );

      if (finalPrice < profitPrice) {
        finalPrice = profitPrice;
        appliedRules.push(
          `Profit Margin Rule applied: price raised to keep ${marginPercent}% profit above base cost`
        );
      }
    }
  }

  /*
    Minimum Margin Protection:
    This is a safety rule. It prevents the recommended price
    from going below the minimum allowed margin.
  */
  if (minimumMarginRule && baseCost > 0) {
    const marginPercent = Number(minimumMarginRule.value);

    if (Number.isFinite(marginPercent) && marginPercent > 0) {
      const minimumSafePrice = Number(
        (baseCost * (1 + marginPercent / 100)).toFixed(2)
      );

      if (finalPrice < minimumSafePrice) {
        finalPrice = minimumSafePrice;
        appliedRules.push(
          `Minimum Margin Protection applied: price raised to protect ${marginPercent}% minimum margin`
        );
      }
    }
  }

  /*
    Maximum Price Limit:
    Caps the recommended price if it exceeds the maximum allowed value.
  */
  if (maximumPriceRule) {
    const maximumPrice = Number(maximumPriceRule.value);

    if (
      Number.isFinite(maximumPrice) &&
      maximumPrice > 0 &&
      finalPrice > maximumPrice
    ) {
      finalPrice = maximumPrice;
      appliedRules.push(
        `Maximum Price Limit applied: price capped at ${maximumPrice.toFixed(
          2
        )} SAR`
      );
    }
  }

  /*
    Rounding Rule:
    Adjusts the final price ending, such as 0.99 or 0.50.
  */
  if (roundingRule) {
    const roundingValue = Number(roundingRule.value);

    if (Number.isFinite(roundingValue)) {
      const beforeRounding = finalPrice;
      finalPrice = roundUpToPriceEnding(finalPrice, roundingValue);

      if (finalPrice !== beforeRounding) {
        appliedRules.push(
          `Rounding Rule applied: final price adjusted to end with ${roundingValue.toFixed(
            2
          )}`
        );
      }
    }
  }

  /*
    Safety check:
    Rounding may increase the price, so the maximum cap is applied again.
  */
  if (maximumPriceRule) {
    const maximumPrice = Number(maximumPriceRule.value);

    if (
      Number.isFinite(maximumPrice) &&
      maximumPrice > 0 &&
      finalPrice > maximumPrice
    ) {
      finalPrice = maximumPrice;
      appliedRules.push(
        `Maximum Price Limit re-applied after rounding: final price capped at ${maximumPrice.toFixed(
          2
        )} SAR`
      );
    }
  }

  return {
    finalPrice: Number(finalPrice.toFixed(2)),
    appliedRules,
    allRules: getAllAppliedRules(productInput),
  };
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

    const productInput = await buildProductPricingAnalysisInput(
      userId,
      productId
    );

    if (!productInput) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const analysis = await analyzeProductRisk(productInput);

    let aiRecommendation;

    try {
      aiRecommendation = await generateAIPriceRecommendation(
        productInput,
        analysis
      );
    } catch (aiError) {
      console.error("Gemini recommendation error:", aiError.message);

      const fallbackRecommendedPrice =
        buildFallbackRecommendedPrice(productInput);

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

    const aiSuggestedPrice = Number(aiRecommendation?.recommended_price);
    const initialRecommendedPrice =
      Number.isFinite(aiSuggestedPrice) && aiSuggestedPrice > 0
        ? aiSuggestedPrice
        : buildFallbackRecommendedPrice(productInput);

    const ruleBasedResult = applyPricingRulesToRecommendation(
      productInput,
      initialRecommendedPrice
    );

    aiRecommendation.recommended_price = ruleBasedResult.finalPrice;

    aiRecommendation.recommendation_type =
      ruleBasedResult.finalPrice > productInput.current_price
        ? "increase"
        : ruleBasedResult.finalPrice < productInput.current_price
        ? "decrease"
        : "maintain";

    if (ruleBasedResult.appliedRules.length > 0) {
      const originalReason = aiRecommendation.reason
        ? `${aiRecommendation.reason} `
        : "";

      aiRecommendation.reason = `${originalReason}Applied pricing rules: ${ruleBasedResult.appliedRules.join(
        "; "
      )}.`;
    }

    aiRecommendation.applied_rules = ruleBasedResult.appliedRules;

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
          product_rules: productInput.product_rules || [],
          category_rules: productInput.category_rules || [],
          season_rules: productInput.season_rules || [],
          applied_rules: ruleBasedResult.appliedRules,
          all_rules: ruleBasedResult.allRules,
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