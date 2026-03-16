import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/auth";

export const authService = {
  signup: async (email, password, businessName) => {
    const response = await axios.post(
      `${API_BASE_URL}/signup`,
      {
        email,
        password,
        businessName,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },

  login: async (email, password) => {
    const response = await axios.post(
      `${API_BASE_URL}/login`,
      {
        email,
        password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  },
};