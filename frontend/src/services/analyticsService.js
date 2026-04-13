import api from "./api";

export async function fetchAnalytics() {
  const response = await api.get("/analytics");
  return response.data;
}