import api from "./api";

export const getPricingRules = async (userId) => {
  const response = await api.get("/pricing-rules", {
    headers: {
      "user-id": userId,
    },
  });
  return response.data;
};

export const createPricingRule = async (userId, payload) => {
  const response = await api.post("/pricing-rules", payload, {
    headers: {
      "user-id": userId,
    },
  });
  return response.data;
};

export const updatePricingRule = async (userId, id, payload) => {
  const response = await api.put(`/pricing-rules/${id}`, payload, {
    headers: {
      "user-id": userId,
    },
  });
  return response.data;
};

export const deletePricingRule = async (userId, id) => {
  const response = await api.delete(`/pricing-rules/${id}`, {
    headers: {
      "user-id": userId,
    },
  });
  return response.data;
};