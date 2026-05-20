import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../client";
import { useNavigate } from "react-router-dom";
import {
  Package,
  DollarSign,
  SlidersHorizontal,
  Calendar,
  LayoutDashboard,
  FileText,
  BarChart3,
  Bot,
  X,
  Send,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userName, setUserName] = useState("");

  // chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! I'm PriceWise AI 👋 Ask me anything about pricing your menu, managing costs, or seasonal strategies.",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const getUserName = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name")
        .eq("user_id", user.id)
        .single();
      const name = profile?.business_name || user.email?.split("@")[0] || "";
      setUserName(name);
    };
    getUserName();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { from: "user", text: trimmed }]);
    setInput("");
    // placeholder bot reply — replace with real AI call later
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Great question! Once I'm connected to your data I'll give you personalized pricing insights. For now, try exploring the Dashboard or Pricing Rules.",
        },
      ]);
    }, 700);
  };

  return (
    <div style={page}>
      <style>{`
        /* === keyframes === */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes pulseBtn {
          0%, 100% { box-shadow: 0 8px 20px rgba(255,255,255,0.15); }
          50%      { box-shadow: 0 8px 30px rgba(255,255,255,0.35); }
        }
        @keyframes hoverFloat {
          0%, 100% { transform: translateY(-6px); opacity: 1; }
          50%      { transform: translateY(-14px); opacity: 1; }
        }
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 8px 25px rgba(91,45,137,0.4), 0 0 0 0 rgba(91,45,137,0.4); }
          50%      { box-shadow: 0 8px 25px rgba(91,45,137,0.4), 0 0 0 14px rgba(91,45,137,0); }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* HERO */
        .hero-card {
          animation: slideUp 0.6s ease-out, float 4s ease-in-out 0.6s infinite;
        }
        .hero-card .start-btn {
          animation: pulseBtn 2.5s ease-in-out infinite;
        }

        /* FEATURE CARDS */
        .info-card {
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          animation: slideUp 0.5s ease-out both;
        }
        .info-card:nth-child(1) { animation-delay: 0.05s; }
        .info-card:nth-child(2) { animation-delay: 0.15s; }
        .info-card:nth-child(3) { animation-delay: 0.25s; }
        .info-card:nth-child(4) { animation-delay: 0.35s; }
        .info-card:nth-child(5) { animation-delay: 0.45s; }
        .info-card:nth-child(6) { animation-delay: 0.55s; }

        .info-card:hover {
          animation: hoverFloat 1.4s ease-in-out infinite;
          box-shadow: 0 20px 45px rgba(91, 45, 137, 0.25);
        }
        .info-card:active {
          transform: translateY(-2px) scale(0.99);
        }

        /* WORKFLOW */
        .step-box {
          animation: slideUp 0.45s ease-out both;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }
        .step-box:nth-child(1) { animation-delay: 0.6s; }
        .step-box:nth-child(2) { animation-delay: 0.7s; }
        .step-box:nth-child(3) { animation-delay: 0.8s; }
        .step-box:nth-child(4) { animation-delay: 0.9s; }
        .step-box:nth-child(5) { animation-delay: 1.0s; }
        .step-box:nth-child(6) { animation-delay: 1.1s; }
        .step-box:hover {
          transform: translateY(-3px);
          background-color: #f0e6ff;
        }

        /* sections */
        .workflow-card { animation: slideUp 0.6s ease-out 0.5s both; }
        .tip-card      { animation: slideUp 0.6s ease-out 0.7s both; }

        /* CHATBOT */
        .chat-fab {
          animation: chatPulse 2.5s ease-in-out infinite;
          transition: transform 0.2s ease;
        }
        .chat-fab:hover {
          transform: scale(1.08);
        }
        .chat-panel {
          animation: panelIn 0.3s ease-out;
        }
      `}</style>

      <section className="hero-card" style={heroCard}>
        <div>
          <h1 style={title}>Welcome back, {userName}</h1>
          <p style={subtitle}>Your smart pricing workspace for Saudi cafés.</p>
        </div>
        <button className="start-btn" style={primaryBtn} onClick={() => navigate("/products")}>
          Start Pricing
        </button>
      </section>

      <div style={cardsGrid}>
        <InfoCard
          icon={<DollarSign />}
          title="Cost Management"
          text="Track fixed costs and variable cost components."
          onClick={() => navigate("/costs")}
        />
        <InfoCard
          icon={<Package />}
          title="Products"
          text="Manage recipes, components, and recommended prices."
          onClick={() => navigate("/products")}
        />
        <InfoCard
          icon={<SlidersHorizontal />}
          title="Pricing Rules"
          text="Set margins, rounding, and maximum price rules."
          onClick={() => navigate("/pricing-rules")}
        />
        <InfoCard
          icon={<Calendar />}
          title="Seasons"
          text="Define seasonal pricing for Ramadan and holidays."
          onClick={() => navigate("/seasons")}
        />
        <InfoCard
          icon={<FileText />}
          title="Daily Pricing Report"
          text="View cost, competitor, and recommended price summaries."
          onClick={() => navigate("/reports")}
        />
        <InfoCard
          icon={<LayoutDashboard />}
          title="Dashboard"
          text="See best-selling and low-selling products at a glance."
          onClick={() => navigate("/dashboard")}
        />
      </div>

      <section className="workflow-card" style={workflowCard}>
        <h2 style={sectionTitle}>PriceWise Workflow</h2>
        <div style={steps}>
          {[
            "Add Costs",
            "Create Products",
            "Set Pricing Rules",
            "Define Seasons",
            "View Reports",
            "Analyze Dashboard",
          ].map((step, index) => (
            <div key={step} className="step-box" style={stepBox}>
              <span style={stepNumber}>{index + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tip-card" style={tipCard}>
        <BarChart3 size={24} />
        <div>
          <strong>Smart Tip</strong>
          <p>
            Keep ingredient costs updated regularly so AI recommendations stay accurate and profitable.
          </p>
        </div>
      </section>

      {/* ====== CHATBOT ====== */}
      {chatOpen && (
        <div className="chat-panel" style={chatPanel}>
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
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  ...chatBubble,
                  ...(m.from === "user" ? userBubble : botBubble),
                }}
              >
                {m.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={chatInputRow}>
            <input
              style={chatInput}
              placeholder="Ask about pricing, costs, seasons..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button style={chatSendBtn} onClick={handleSend} aria-label="Send">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        className="chat-fab"
        style={chatFab}
        onClick={() => setChatOpen((o) => !o)}
        aria-label="Open PriceWise AI"
      >
        {chatOpen ? <X size={26} /> : <Bot size={26} />}
      </button>
    </div>
  );
};

const InfoCard = ({ icon, title, text, onClick }) => (
  <div
    className="info-card"
    style={infoCard}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.();
      }
    }}
  >
    <div style={iconBox}>{icon}</div>
    <h3 style={cardTitle}>{title}</h3>
    <p style={cardText}>{text}</p>
  </div>
);

/* ====== styles ====== */
const page = {
  padding: "40px",
  backgroundColor: "transparent",
  minHeight: "100vh",
  boxSizing: "border-box",
  position: "relative",
};

const heroCard = {
  background: "linear-gradient(135deg, #2d1b4e, #5b2d89)",
  color: "white",
  borderRadius: "24px",
  padding: "34px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "28px",
  boxShadow: "0 18px 45px rgba(45,27,78,0.25)",
};

const title = {
  fontSize: "36px",
  fontWeight: "900",
  margin: 0,
};

const subtitle = {
  fontSize: "17px",
  opacity: 0.85,
  marginTop: "10px",
};

const primaryBtn = {
  backgroundColor: "white",
  color: "#382372",
  border: "none",
  borderRadius: "14px",
  padding: "14px 24px",
  fontSize: "16px",
  fontWeight: "900",
  cursor: "pointer",
};

const cardsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  marginBottom: "28px",
};

const infoCard = {
  backgroundColor: "white",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
};

const iconBox = {
  width: "48px",
  height: "48px",
  borderRadius: "14px",
  backgroundColor: "#f3ecff",
  color: "#5b2d89",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
};

const cardTitle = {
  color: "#111827",
  fontSize: "20px",
  fontWeight: "900",
  marginBottom: "8px",
};

const cardText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const workflowCard = {
  backgroundColor: "white",
  borderRadius: "20px",
  padding: "28px",
  boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
  marginBottom: "24px",
};

const sectionTitle = {
  color: "#382372",
  fontSize: "26px",
  fontWeight: "900",
  marginBottom: "20px",
};

const steps = {
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: "12px",
};

const stepBox = {
  backgroundColor: "#f9f6ff",
  color: "#2d1b4e",
  padding: "14px",
  borderRadius: "14px",
  fontWeight: "800",
  fontSize: "13px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const stepNumber = {
  backgroundColor: "#5b2d89",
  color: "white",
  width: "26px",
  height: "26px",
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  fontSize: "13px",
};

const tipCard = {
  display: "flex",
  gap: "14px",
  alignItems: "center",
  backgroundColor: "#eefaf3",
  color: "#1e5631",
  borderLeft: "5px solid #27ae60",
  borderRadius: "16px",
  padding: "18px",
};

/* === Chatbot styles === */
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
  cursor: "pointer",
};

export default Home;