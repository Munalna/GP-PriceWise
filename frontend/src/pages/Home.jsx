import React from "react";
import { useNavigate } from "react-router-dom";
import { Package, DollarSign, SlidersHorizontal, Calendar, BarChart3 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={page}>
      <section style={heroCard}>
        <div>
          <h1 style={title}>Welcome back, {user?.user_metadata?.name || "Moon"}</h1>
          <p style={subtitle}>
            Your smart pricing workspace for Saudi cafés.
          </p>
        </div>

        <button style={primaryBtn} onClick={() => navigate("/products")}>
          Start Pricing
        </button>
      </section>

      <div style={cardsGrid}>
        <InfoCard icon={<Package />} title="Products" text="Manage recipes, costs, and recommended prices." />
        <InfoCard icon={<DollarSign />} title="Costs" text="Keep fixed and ingredient costs updated." />
        <InfoCard icon={<SlidersHorizontal />} title="Pricing Rules" text="Control margins, rounding, and max prices." />
        <InfoCard icon={<Calendar />} title="Seasons" text="Adjust pricing for Ramadan, holidays, and demand." />
      </div>

      <section style={workflowCard}>
        <h2 style={sectionTitle}>PriceWise Workflow</h2>

        <div style={steps}>
          {["Add Costs", "Create Products", "Assign Rules", "Analyze Pricing", "Review Reports"].map((step, index) => (
            <div key={step} style={stepBox}>
              <span style={stepNumber}>{index + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={tipCard}>
        <BarChart3 size={24} />
        <div>
          <strong>Smart Tip</strong>
          <p>
            Update ingredient costs regularly to keep AI recommendations accurate and profitable.
          </p>
        </div>
      </section>
    </div>
  );
};

const InfoCard = ({ icon, title, text }) => (
  <div style={infoCard}>
    <div style={iconBox}>{icon}</div>
    <h3 style={cardTitle}>{title}</h3>
    <p style={cardText}>{text}</p>
  </div>
);

const page = {
  padding: "40px",
  backgroundColor: "#f8f9fc",
  minHeight: "100vh",
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
  gridTemplateColumns: "repeat(4, 1fr)",
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
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "14px",
};

const stepBox = {
  backgroundColor: "#f9f6ff",
  color: "#2d1b4e",
  padding: "16px",
  borderRadius: "16px",
  fontWeight: "800",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const stepNumber = {
  backgroundColor: "#5b2d89",
  color: "white",
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
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

export default Home;