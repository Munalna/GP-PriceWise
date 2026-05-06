import api from "./api";

export async function getVisualDashboard() {
  const { data } = await api.get("/analytics");
  return data;
}

export const fetchAnalytics = getVisualDashboard;

export async function getPricingRiskSummary() {
  const { data } = await api.get("/analytics/pricing-risk");
  return data;
}

export async function analyzeProductRisk(productId) {
  const { data } = await api.get(`/analytics/products/${productId}/risk`);
  return data;
}

export async function getAIPriceRecommendation(productId) {
  const { data } = await api.post(
    `/analytics/products/${productId}/ai-recommendation`
  );
  return data;
}

export async function checkMarketProduct(name) {
  const { data } = await api.get(`/analytics/market-check?name=${encodeURIComponent(name)}`);
  return data;
}