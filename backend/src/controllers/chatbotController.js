import { askPriceWiseChatbot } from "../services/chatbotService.js";

function isGeminiQuotaError(error) {
  const message = String(error?.message || "");
  return (
    error?.status === 429 ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("Too Many Requests") ||
    message.includes("quota")
  );
}

export async function sendChatMessage(req, res, next) {
  try {
    const { message } = req.body;
    const trimmedMessage = String(message || "").trim();

    if (!trimmedMessage) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const reply = await askPriceWiseChatbot(trimmedMessage);

    return res.json({
      success: true,
      reply,
    });
  } catch (error) {
    if (isGeminiQuotaError(error)) {
      return res.status(429).json({
        success: false,
        code: "AI_QUOTA_EXCEEDED",
        reply:
          "PriceWise AI has reached the current Gemini quota. Please wait a bit and try again, or check the Gemini API billing and quota settings.",
      });
    }

    next(error);
  }
}
