import api from "./api";

export const getPricingRules = async () => {
  const response = await api.get("/pricing-rules");
  return response.data;
};

export const createPricingRule = async (payload) => {
  const response = await api.post("/pricing-rules", payload);
  return response.data;
};

export const updatePricingRule = async (id, payload) => {
  const response = await api.patch(`/pricing-rules/${id}`, payload);
  return response.data;
};

export const deletePricingRule = async (id) => {
  const response = await api.delete(`/pricing-rules/${id}`);
  return response.data;
};