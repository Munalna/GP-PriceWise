import React, { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { sendChatbotMessage } from "../../services/chatbotService";

const Chatbot = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! I'm PriceWise AI. Ask me anything about pricing your menu, managing costs, or seasonal strategies.",
    },
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || chatLoading) return;

    setMessages((prev) => [...prev, { from: "user", text: trimmed }]);
    setInput("");
    setChatLoading(true);

    try {
      const data = await sendChatbotMessage(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: data.reply || "I could not generate a reply right now.",
        },
      ]);
    } catch (error) {
      const reply =
        error?.response?.data?.reply ||
        "Sorry, I could not connect to PriceWise AI right now.";

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: reply,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .pricewise-chat-fab:hover {
          transform: scale(1.08);
        }

        .pricewise-chat-panel {
          animation: panelIn 0.25s ease-out;
        }

        @keyframes typingDot {
          0%, 80%, 100% { opacity: 0.35; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-3px); }
        }

        .pricewise-typing-dot {
          animation: typingDot 1.1s ease-in-out infinite;
        }

        .pricewise-typing-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .pricewise-typing-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        @media (max-width: 600px) {
          .pricewise-chat-panel {
            left: 16px !important;
            right: 16px !important;
            width: auto !important;
            bottom: 92px !important;
          }

          .pricewise-chat-fab {
            right: 18px !important;
            bottom: 20px !important;
          }
        }
      `}</style>

      {chatOpen && (
        <div className="pricewise-chat-panel" style={chatPanel}>
          <div style={chatHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={chatHeaderIcon}>
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: "15px" }}>PriceWise AI</div>
                <div style={{ fontSize: "11px", opacity: 0.85 }}>Your pricing assistant</div>
              </div>
            </div>
            <button style={chatCloseBtn} onClick={() => setChatOpen(false)} aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          <div style={chatMessages}>
            {messages.map((message, index) => (
              <div
                key={`${message.from}-${index}`}
                style={{
                  ...chatBubble,
                  ...(message.from === "user" ? userBubble : botBubble),
                }}
              >
                {message.text}
              </div>
            ))}
            {chatLoading && (
              <div style={{ ...chatBubble, ...botBubble, ...typingBubble }}>
                <span style={typingLabel}>PriceWise AI is typing</span>
                <span style={typingDots}>
                  <span className="pricewise-typing-dot" style={typingDot} />
                  <span className="pricewise-typing-dot" style={typingDot} />
                  <span className="pricewise-typing-dot" style={typingDot} />
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={chatInputRow}>
            <input
              style={chatInput}
              placeholder="Ask about pricing, costs, seasons..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleSend()}
            />
            <button
              style={{
                ...chatSendBtn,
                opacity: chatLoading ? 0.65 : 1,
                cursor: chatLoading ? "not-allowed" : "pointer",
              }}
              onClick={handleSend}
              disabled={chatLoading}
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        className="pricewise-chat-fab"
        style={chatFab}
        onClick={() => setChatOpen((open) => !open)}
        aria-label="Open PriceWise AI"
      >
        {chatOpen ? <X size={26} /> : <Bot size={26} />}
      </button>
    </>
  );
};

const chatFab = {
  position: "fixed",
  bottom: "28px",
  right: "28px",
  width: "62px",
  height: "62px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #5b2d89, #2d1b4e)",
  color: "white",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 8px 25px rgba(91,45,137,0.35)",
  zIndex: 1000,
};

const chatPanel = {
  position: "fixed",
  bottom: "104px",
  right: "28px",
  width: "360px",
  maxHeight: "520px",
  backgroundColor: "white",
  borderRadius: "20px",
  boxShadow: "0 25px 60px rgba(45,27,78,0.3)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  zIndex: 1000,
};

const chatHeader = {
  background: "linear-gradient(135deg, #2d1b4e, #5b2d89)",
  color: "white",
  padding: "16px 18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const chatHeaderIcon = {
  width: "36px",
  height: "36px",
  borderRadius: "12px",
  backgroundColor: "rgba(255,255,255,0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const chatCloseBtn = {
  background: "rgba(255,255,255,0.15)",
  border: "none",
  color: "white",
  cursor: "pointer",
  width: "30px",
  height: "30px",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const chatMessages = {
  flex: 1,
  overflowY: "auto",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  backgroundColor: "#faf8ff",
  minHeight: "240px",
  maxHeight: "340px",
};

const chatBubble = {
  padding: "10px 14px",
  borderRadius: "14px",
  fontSize: "14px",
  lineHeight: 1.5,
  maxWidth: "80%",
  wordWrap: "break-word",
  whiteSpace: "pre-wrap",
};

const botBubble = {
  backgroundColor: "white",
  color: "#2d1b4e",
  alignSelf: "flex-start",
  border: "1px solid #ece4ff",
  borderBottomLeftRadius: "4px",
};

const userBubble = {
  background: "linear-gradient(135deg, #5b2d89, #7c3aed)",
  color: "white",
  alignSelf: "flex-end",
  borderBottomRightRadius: "4px",
};

const typingBubble = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  maxWidth: "fit-content",
};

const typingLabel = {
  color: "#6b5b86",
  fontSize: "13px",
};

const typingDots = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
};

const typingDot = {
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  backgroundColor: "#5b2d89",
  display: "inline-block",
};

const chatInputRow = {
  display: "flex",
  gap: "8px",
  padding: "12px",
  borderTop: "1px solid #ece4ff",
  backgroundColor: "white",
};

const chatInput = {
  flex: 1,
  border: "1px solid #ece4ff",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  color: "#2d1b4e",
  minWidth: 0,
};

const chatSendBtn = {
  backgroundColor: "#5b2d89",
  color: "white",
  border: "none",
  borderRadius: "12px",
  width: "42px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default Chatbot;
