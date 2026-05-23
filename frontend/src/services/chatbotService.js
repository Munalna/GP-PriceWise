import api from "./api";

export async function sendChatbotMessage(message) {
  const res = await api.post("/chatbot", { message });
  return res.data;
}
