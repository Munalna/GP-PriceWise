import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { fetchAnalytics } from "../services/analyticsService";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    top_products: [],
    low_products: [],
    profit: 0,
  });
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchAnalytics();
      setAnalytics({
        top_products: Array.isArray(data?.top_products) ? data.top_products : [],
        low_products: Array.isArray(data?.low_products) ? data.low_products : [],
        profit: data?.profit ?? 0,
      });
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pieData = [
    { name: "Top Products", value: analytics.top_products.length },
    { name: "Low Products", value: analytics.low_products.length },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Analytics</h2>
          <p style={styles.subtitle}>
            Visual dashboard for product performance and summary metrics.
          </p>
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <span style={{ fontWeight: 800 }}>Request failed:</span> {error}
          <button style={styles.retryBtn} onClick={load} type="button">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={styles.card}>Loading analytics...</div>
      ) : (
        <>
          <div style={styles.cardsGrid}>
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Profit</div>
              <div style={styles.metricValue}>{analytics.profit}</div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Top Products</div>
              <div style={styles.metricValue}>{analytics.top_products.length}</div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Low Products</div>
              <div style={styles.metricValue}>{analytics.low_products.length}</div>
            </div>
          </div>

          <div style={styles.chartsGrid}>
            <div style={styles.card}>
              <h3 style={styles.chartTitle}>Top Products</h3>
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={analytics.top_products}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.chartTitle}>Distribution</h3>
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                      {pieData.map((entry, index) => (
                        <Cell key={index} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page: { padding: 22, maxWidth: 1200 },
  headerRow: { marginBottom: 16 },
  title: { margin: 0, fontSize: 34, fontWeight: 900, color: "#111827" },
  subtitle: { margin: "6px 0 0", color: "#6b7280", fontSize: 14 },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
    marginBottom: 16,
  },

  metricCard: {
    background: "#fff",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    border: "1px solid #eef2f7",
  },

  metricLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: 700,
    marginBottom: 8,
  },

  metricValue: {
    fontSize: 28,
    color: "#111827",
    fontWeight: 900,
  },

  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },

  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    border: "1px solid #eef2f7",
  },

  chartTitle: {
    marginTop: 0,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: 800,
    color: "#111827",
  },

  errorBox: {
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#9f1239",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  retryBtn: {
    border: "none",
    background: "#9f1239",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
};