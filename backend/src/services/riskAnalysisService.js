const buildNumeric = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const roundTo = (value, decimals = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(decimals));
};

const normalizeSeason = (season) => {
  if (!season) return "Unknown";
  return String(season).trim();
};

const getSeasonRiskModifier = (season) => {
  const normalized = normalizeSeason(season).toLowerCase();

  const highDemandSeasons = ["ramadan", "winter", "holiday", "summer"];
  const mediumDemandSeasons = ["spring", "autumn", "fall"];

  if (highDemandSeasons.includes(normalized)) {
    return {
      demand_level: "High",
      modifier: 1.15,
      note: "Season suggests stronger pricing flexibility or higher demand.",
    };
  }

  if (mediumDemandSeasons.includes(normalized)) {
    return {
      demand_level: "Medium",
      modifier: 1.0,
      note: "Season suggests normal pricing pressure.",
    };
  }

  return {
    demand_level: "Unknown",
    modifier: 0.95,
    note: "Season impact is unclear, so analysis is more conservative.",
  };
};

const calculateAppliedMargin = (currentPrice, baseCost) => {
  if (currentPrice <= 0) return 0;
  return ((currentPrice - baseCost) / currentPrice) * 100;
};

const calculateMarkup = (currentPrice, baseCost) => {
  if (baseCost <= 0) return 0;
  return ((currentPrice - baseCost) / baseCost) * 100;
};

const calculateCompetitorGap = (currentPrice, competitorAveragePrice) => {
  return currentPrice - competitorAveragePrice;
};

const calculateCompetitorGapPercent = (currentPrice, competitorAveragePrice) => {
  if (competitorAveragePrice <= 0) return 0;
  return ((currentPrice - competitorAveragePrice) / competitorAveragePrice) * 100;
};

const calculateProfitPerUnit = (currentPrice, baseCost) => {
  return currentPrice - baseCost;
};

const calculateTargetMarginGap = (appliedMargin, targetMargin) => {
  if (targetMargin === null || targetMargin === undefined) return null;
  return appliedMargin - targetMargin;
};

const determineCompetitiveRisk = (competitorGapPercent) => {
  if (competitorGapPercent >= 15) return "High";
  if (competitorGapPercent >= 7) return "Medium";
  if (competitorGapPercent <= -15) return "Medium";
  return "Low";
};

const determineProfitabilityRisk = (profitPerUnit, appliedMargin, targetMarginGap) => {
  if (profitPerUnit < 0) return "High";
  if (appliedMargin < 10) return "High";
  if (targetMarginGap !== null && targetMarginGap < -10) return "High";
  if (appliedMargin < 20) return "Medium";
  if (targetMarginGap !== null && targetMarginGap < -5) return "Medium";
  return "Low";
};

const determinePricingHealth = ({
  riskScore,
  profitPerUnit,
  appliedMargin,
  targetMarginGap,
}) => {
  if (profitPerUnit < 0) return "Risky";
  if (riskScore >= 70) return "Risky";

  if (appliedMargin < 15) return "Weak";
  if (targetMarginGap !== null && targetMarginGap < -5) return "Weak";
  if (riskScore >= 40) return "Weak";

  return "Healthy";
};

const determineMarketComparison = (competitorGapPercent) => {
  if (competitorGapPercent >= 8) return "Overpriced";
  if (competitorGapPercent <= -8) return "Underpriced";
  return "Competitive";
};

const determineProfitImpact = ({
  profitPerUnit,
  appliedMargin,
  targetMarginGap,
}) => {
  if (profitPerUnit < 0) return "Negative Profit Impact";
  if (appliedMargin < 15) return "Low Profit Impact";
  if (targetMarginGap !== null && targetMarginGap < -5) return "Low Profit Impact";
  return "Positive Profit Impact";
};

const generatePricingInsight = ({
  pricingHealth,
  marketComparison,
  profitImpact,
  riskLabel,
  competitorGapPercent,
  targetMarginGap,
}) => {
  if (riskLabel === "Overpriced") {
    return "This product is priced above market expectations and may lose competitiveness.";
  }

  if (riskLabel === "Underpriced") {
    return "This product appears underpriced relative to cost structure or target margin expectations.";
  }

  if (profitImpact === "Negative Profit Impact") {
    return "The current price is harming profitability and should be reviewed urgently.";
  }

  if (pricingHealth === "Weak" && marketComparison === "Overpriced") {
    return "The product is above market while pricing health is weak, which suggests a risky pricing position.";
  }

  if (pricingHealth === "Weak" && targetMarginGap !== null && targetMarginGap < 0) {
    return "The product remains profitable, but it is still below the desired pricing target.";
  }

  if (marketComparison === "Competitive" && Math.abs(competitorGapPercent) <= 5) {
    return "This product is priced close to market average and shows a relatively balanced pricing position.";
  }

  return "This product shows acceptable pricing conditions, but it should still be monitored regularly.";
};

const buildRiskScore = ({
  competitorGapPercent,
  profitPerUnit,
  appliedMargin,
  targetMarginGap,
  fixedVariableCostRatio,
  seasonModifier,
}) => {
  let score = 0;

  if (profitPerUnit < 0) score += 40;
  else if (profitPerUnit < 2) score += 20;

  if (appliedMargin < 10) score += 25;
  else if (appliedMargin < 20) score += 15;

  if (competitorGapPercent >= 20) score += 25;
  else if (competitorGapPercent >= 10) score += 15;
  else if (competitorGapPercent <= -20) score += 15;
  else if (competitorGapPercent <= -10) score += 10;

  if (targetMarginGap !== null) {
    if (targetMarginGap < -15) score += 20;
    else if (targetMarginGap < -8) score += 10;
  }

  if (fixedVariableCostRatio > 2) score += 10;
  else if (fixedVariableCostRatio > 1.2) score += 5;

  if (seasonModifier < 1) score += 5;

  return Math.max(0, Math.min(100, roundTo(score, 0)));
};

const determineRiskLabel = ({
  currentPrice,
  baseCost,
  competitorGapPercent,
  appliedMargin,
  targetMarginGap,
  riskScore,
}) => {
  if (currentPrice < baseCost) return "Underpriced";

  if (competitorGapPercent >= 12 && appliedMargin >= 20) {
    return "Overpriced";
  }

  if (targetMarginGap !== null && targetMarginGap < -8) {
    return "Underpriced";
  }

  if (riskScore >= 70) return "High Risk";
  if (riskScore >= 40) return "Medium Risk";
  return "Competitive";
};

const generateShortReason = ({
  riskLabel,
  competitorGapPercent,
  profitPerUnit,
  targetMarginGap,
  appliedMargin,
}) => {
  if (profitPerUnit < 0) {
    return "Current price is below cost, creating direct profitability risk.";
  }

  if (riskLabel === "Overpriced") {
    return "Current price is noticeably above competitor average, which may reduce competitiveness.";
  }

  if (riskLabel === "Underpriced") {
    return "Price appears too low compared with cost structure or target margin expectations.";
  }

  if (targetMarginGap !== null && targetMarginGap < 0) {
    return "Current price is profitable but below the desired target margin.";
  }

  if (appliedMargin < 15) {
    return "Margin is relatively thin, leaving limited room for cost pressure or market shifts.";
  }

  if (Math.abs(competitorGapPercent) <= 6) {
    return "Price is close to market average and shows balanced pricing health.";
  }

  return "Pricing is acceptable, but some indicators should still be monitored.";
};

const generateRecommendation = ({
  riskLabel,
  competitorGapPercent,
  profitPerUnit,
  targetMarginGap,
  appliedMargin,
}) => {
  if (profitPerUnit < 0) {
    return "Increase the current price above cost immediately or reduce cost components before continuing this pricing strategy.";
  }

  if (riskLabel === "Overpriced") {
    return "Consider reducing the price slightly or strengthening product value justification to stay competitive.";
  }

  if (riskLabel === "Underpriced") {
    return "Consider increasing the price gradually to improve margin and align better with your business targets.";
  }

  if (targetMarginGap !== null && targetMarginGap < -5) {
    return "Review pricing against the target margin and adjust upward if the market can absorb it.";
  }

  if (appliedMargin < 15) {
    return "Monitor cost fluctuations closely and consider a small price adjustment to protect profitability.";
  }

  if (Math.abs(competitorGapPercent) <= 6) {
    return "Maintain the current pricing strategy and continue monitoring competitor movement and seasonal changes.";
  }

  return "Keep the current price, but recheck the product regularly as market conditions change.";
};

const buildMetrics = (productData) => {
  const productName = productData.product_name || productData.name || "Unknown Product";
  const category = productData.category || "Unknown";
  const season = normalizeSeason(productData.season);

  const baseCost = buildNumeric(productData.base_cost);
  const currentPrice = buildNumeric(productData.current_price);
  const competitorAveragePrice = buildNumeric(productData.competitor_average_price);
  const fixedVariableCostRatio = buildNumeric(productData.fixed_variable_cost_ratio);
  const targetMargin =
    productData.target_margin === null || productData.target_margin === undefined
      ? null
      : buildNumeric(productData.target_margin);

  const seasonImpact = getSeasonRiskModifier(season);

  const appliedMargin = calculateAppliedMargin(currentPrice, baseCost);
  const markup = calculateMarkup(currentPrice, baseCost);
  const competitorGap = calculateCompetitorGap(currentPrice, competitorAveragePrice);
  const competitorGapPercent = calculateCompetitorGapPercent(currentPrice, competitorAveragePrice);
  const profitPerUnit = calculateProfitPerUnit(currentPrice, baseCost);
  const targetMarginGap = calculateTargetMarginGap(appliedMargin, targetMargin);

  return {
    product_name: productName,
    category,
    season,
    base_cost: roundTo(baseCost),
    current_price: roundTo(currentPrice),
    competitor_average_price: roundTo(competitorAveragePrice),
    fixed_variable_cost_ratio: roundTo(fixedVariableCostRatio),
    target_margin: targetMargin === null ? null : roundTo(targetMargin),
    applied_margin: roundTo(appliedMargin),
    markup: roundTo(markup),
    competitor_gap: roundTo(competitorGap),
    competitor_gap_percent: roundTo(competitorGapPercent),
    profit_per_unit: roundTo(profitPerUnit),
    target_margin_gap: targetMarginGap === null ? null : roundTo(targetMarginGap),
    season_context: seasonImpact,
  };
};

const buildRuleBasedAnalysis = (metrics) => {
  const competitiveRisk = determineCompetitiveRisk(metrics.competitor_gap_percent);
  const profitabilityRisk = determineProfitabilityRisk(
    metrics.profit_per_unit,
    metrics.applied_margin,
    metrics.target_margin_gap
  );

  const riskScore = buildRiskScore({
    competitorGapPercent: metrics.competitor_gap_percent,
    profitPerUnit: metrics.profit_per_unit,
    appliedMargin: metrics.applied_margin,
    targetMarginGap: metrics.target_margin_gap,
    fixedVariableCostRatio: metrics.fixed_variable_cost_ratio,
    seasonModifier: metrics.season_context.modifier,
  });

  const riskLabel = determineRiskLabel({
    currentPrice: metrics.current_price,
    baseCost: metrics.base_cost,
    competitorGapPercent: metrics.competitor_gap_percent,
    appliedMargin: metrics.applied_margin,
    targetMarginGap: metrics.target_margin_gap,
    riskScore,
  });

  const pricingHealth = determinePricingHealth({
    riskScore,
    profitPerUnit: metrics.profit_per_unit,
    appliedMargin: metrics.applied_margin,
    targetMarginGap: metrics.target_margin_gap,
  });

  const marketComparison = determineMarketComparison(
    metrics.competitor_gap_percent
  );

  const profitImpact = determineProfitImpact({
    profitPerUnit: metrics.profit_per_unit,
    appliedMargin: metrics.applied_margin,
    targetMarginGap: metrics.target_margin_gap,
  });

  const pricingInsight = generatePricingInsight({
    pricingHealth,
    marketComparison,
    profitImpact,
    riskLabel,
    competitorGapPercent: metrics.competitor_gap_percent,
    targetMarginGap: metrics.target_margin_gap,
  });

  const shortReason = generateShortReason({
    riskLabel,
    competitorGapPercent: metrics.competitor_gap_percent,
    profitPerUnit: metrics.profit_per_unit,
    targetMarginGap: metrics.target_margin_gap,
    appliedMargin: metrics.applied_margin,
  });

  const recommendation = generateRecommendation({
    riskLabel,
    competitorGapPercent: metrics.competitor_gap_percent,
    profitPerUnit: metrics.profit_per_unit,
    targetMarginGap: metrics.target_margin_gap,
    appliedMargin: metrics.applied_margin,
  });

  return {
    pricing_health: pricingHealth,
    market_comparison: marketComparison,
    profit_impact: profitImpact,
    pricing_insight: pricingInsight,
    risk_label: riskLabel,
    risk_score: riskScore,
    competitive_risk: competitiveRisk,
    profitability_risk: profitabilityRisk,
    short_reason: shortReason,
    recommendation,
  };
};

const analyzeProductRisk = async (productData) => {
  const metrics = buildMetrics(productData);
  const ruleBasedResult = buildRuleBasedAnalysis(metrics);

  return {
    ...metrics,
    ...ruleBasedResult,
    analysis_source: "rule_based",
  };
};

const analyzeMultipleProductsRisk = async (products = []) => {
  if (!Array.isArray(products)) return [];

  const analyses = await Promise.all(
    products.map(async (product) => {
      const result = await analyzeProductRisk(product);
      return {
        product_id: product.id || product.product_id || null,
        ...result,
      };
    })
  );

  return analyses.sort((a, b) => b.risk_score - a.risk_score);
};

const buildRiskSummary = (analyses = []) => {
  const summary = {
    total_analyzed: analyses.length,
    high_risk_count: 0,
    medium_risk_count: 0,
    low_risk_count: 0,
    top_alerts: [],
  };

  analyses.forEach((item) => {
    if (
      item.risk_label === "High Risk" ||
      item.risk_label === "Overpriced" ||
      (item.risk_score !== undefined && item.risk_score >= 70)
    ) {
      summary.high_risk_count += 1;
    } else if (
      item.risk_label === "Medium Risk" ||
      (item.risk_score !== undefined && item.risk_score >= 40)
    ) {
      summary.medium_risk_count += 1;
    } else {
      summary.low_risk_count += 1;
    }
  });

  summary.top_alerts = analyses.slice(0, 5).map((item) => ({
    product_id: item.product_id || null,
    product_name: item.product_name,
    risk_label: item.risk_label,
    risk_score: item.risk_score,
    short_reason: item.short_reason,
  }));

  return summary;
};

export {
  buildMetrics,
  buildRuleBasedAnalysis,
  analyzeProductRisk,
  analyzeMultipleProductsRisk,
  buildRiskSummary,
};