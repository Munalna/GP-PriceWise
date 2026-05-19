import axios from "axios";
import { supabase } from "../client";

let cachedToken = null;
let tokenExpiry = null;

const getFreshToken = async () => {
  const now = Date.now();
  const sixtySeconds = 60 * 1000;

  if (cachedToken && tokenExpiry && now < tokenExpiry - sixtySeconds) {
    return cachedToken;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  cachedToken = data?.session?.access_token ?? null;
  tokenExpiry = data?.session?.expires_at
    ? data.session.expires_at * 1000
    : null;

  return cachedToken;
};
// ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getFreshToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

supabase.auth.onAuthStateChange(() => {
  cachedToken = null;
  tokenExpiry = null;
});

export default api;
