import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDailyReport,
  exportReportPdf,
} from "../services/reportService";

// ── Helpers ──────────────────────────────────────────────────────
function sar(n) {
  return `SAR ${Number(n).toFixed(2)}`;
}

function calcMargin(cost, recommended) {
  if (!cost || cost === 0) return null;
  return ((recommended - cost) / cost) * 100;
}

function MarginBadge({ margin }) {
  if (margin === null) return <span style={styles.badgeNeutral}>N/A</span>;
  const color =
    margin >= 50 ? styles.badgeGreen :
    margin >= 20 ? styles.badgeYellow :
    styles.badgeRed;
  return <span style={{ ...styles.badge, ...color }}>{margin.toFixed(0)}%</span>;
}

function VsMarket({ recommended, competitor }) {
  if (!competitor || competitor === 0)
    return <span style={{ color: "#9ca3af", fontSize: 13 }}>N/A</span>;
  const diff = ((recommended - competitor) / competitor) * 100;
  if (diff > 10)
    return <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 13 }}>▲ {diff.toFixed(0)}% above</span>;
  if (diff < -10)
    return <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 13 }}>▼ {Math.abs(diff).toFixed(0)}% below</span>;
  return <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 13 }}>✓ Competitive</span>;
}

// ── Component ────────────────────────────────────────────────────
export default function Reports() {
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);

  const { data: rows = [], isLoading: loading, error: fetchError } = useQuery({
    queryKey: ["dailyReport"],
    queryFn: async () => {
      const data = await fetchDailyReport();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 3,
  });

  const error = fetchError?.message || "";
  const reload = () => queryClient.invalidateQueries({ queryKey: ["dailyReport"] });

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportReportPdf();
    } catch (err) {
      alert(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // ── Summary stats ─────────────────────────────────────────────
  const totalProducts  = rows.length;
  const margins        = rows.map((r) => calcMargin(r.cost, r.recommended_price)).filter((m) => m !== null);
  const avgMargin      = margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : null;
  const avgCost        = totalProducts > 0 ? rows.reduce((s, r) => s + Number(r.cost || 0), 0) / totalProducts : 0;
  const avgRecommended = totalProducts > 0 ? rows.reduce((s, r) => s + Number(r.recommended_price || 0), 0) / totalProducts : 0;

  const summaryCards = [
    { label: "Total Products",  value: totalProducts },
    { label: "Avg Cost",        value: `SAR ${avgCost.toFixed(2)}` },
    { label: "Avg Recommended", value: `SAR ${avgRecommended.toFixed(2)}` },
    { label: "Avg Margin",      value: avgMargin !== null ? `${avgMargin.toFixed(1)}%` : "N/A" },
  ];

  return (
    <div style={styles.page}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Reports</h2>
          <p style={styles.subtitle}>View daily pricing reports and export them as PDF.</p>
        </div>
        <div style={styles.actionsRow}>
        
          <button
            style={{ ...styles.primaryBtn, opacity: exporting ? 0.7 : 1 }}
            onClick={handleExport}
            type="button"
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export Report (PDF)"}
          </button>
          
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────── */}
      {error && (
        <div style={styles.errorBox}>
          <span style={{ fontWeight: 800 }}>Request failed:</span> {error}
          <button style={styles.retryBtn} onClick={reload} type="button">Retry</button>
        </div>
      )}

      {/* ── Summary cards ──────────────────────────────────── */}
      {!loading && rows.length > 0 && (
        <div style={styles.cardsRow}>
          {summaryCards.map(({ label, value }) => (
            <div key={label} style={styles.summaryCard}>
              <p style={styles.cardLabel}>{label}</p>
              <p style={styles.cardValue}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────── */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loadingRow}>Loading report...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Product</th>
                  <th style={styles.th}>Cost</th>
                  <th style={styles.th}>Competitor Price</th>
                  <th style={styles.th}>Recommended Price</th>
                  <th style={styles.th}>Margin %</th>
                  <th style={styles.th}>vs Market</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={styles.emptyCell}>
                      No report data found. Import sales data to get started.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const margin = calcMargin(row.cost, row.recommended_price);
                    return (
                      <tr key={index} style={{ background: index % 2 === 0 ? "#fff" : "#faf9ff" }}>
                        <td style={styles.tdName}>{row.product_name || "—"}</td>
                        <td style={styles.td}>{sar(row.cost)}</td>
                        <td style={styles.td}>{sar(row.competitor_price)}</td>
                        <td style={{ ...styles.td, fontWeight: 700, color: "#382372" }}>
                          {sar(row.recommended_price)}
                        </td>
                        <td style={styles.td}>
                          <MarginBadge margin={margin} />
                        </td>
                        <td style={styles.td}>
                          <VsMarket recommended={row.recommended_price} competitor={row.competitor_price} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = {
  page:       { padding: 22, maxWidth: 1200 },
  headerRow:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 },
  actionsRow: { display: "flex", gap: 12, alignItems: "center" },
  title:      { margin: 0, fontSize: 34, fontWeight: 900, color: "#111827" },
  subtitle:   { margin: "6px 0 0", color: "#6b7280", fontSize: 14 },

  cardsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 },
  summaryCard: {
    background: "#fff",
    borderRadius: 14,
    padding: "16px 20px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    border: "1px solid #eef2f7",
  },
  cardLabel: { margin: 0, fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 6 },
  cardValue: { margin: 0, fontSize: 22, fontWeight: 900, color: "#382372" },

  tableCard: {
    background: "#fff",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    border: "1px solid #eef2f7",
  },
  table:   { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    fontSize: 12,
    color: "#475569",
    fontWeight: 900,
    borderBottom: "2px solid #eef2f7",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 14px",
    fontSize: 14,
    color: "#374151",
    borderBottom: "1px solid #f1f5f9",
  },
  tdName: {
    padding: "14px 14px",
    fontSize: 14,
    color: "#111827",
    fontWeight: 800,
    borderBottom: "1px solid #f1f5f9",
  },
  emptyCell: { padding: 32, textAlign: "center", color: "#6b7280", fontStyle: "italic", fontSize: 14 },

  badge:        { display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 800 },
  badgeNeutral: { display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 800, background: "#f3f4f6", color: "#6b7280" },
  badgeGreen:   { background: "#dcfce7", color: "#16a34a" },
  badgeYellow:  { background: "#fef9c3", color: "#ca8a04" },
  badgeRed:     { background: "#fee2e2", color: "#dc2626" },

  primaryBtn: {
    background: "#382372", border: "none", color: "#fff", borderRadius: 12,
    padding: "12px 16px", cursor: "pointer", fontWeight: 900,
    boxShadow: "0 8px 18px rgba(56,35,114,0.22)", whiteSpace: "nowrap",
  },
  secondaryBtn: {
    background: "#4b93e7", border: "none", color: "#fff", borderRadius: 12,
    padding: "12px 16px", cursor: "pointer", fontWeight: 900, whiteSpace: "nowrap",
  },
  loadingRow: { color: "#475569", padding: 20 },
  errorBox: {
    background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239",
    padding: 12, borderRadius: 12, marginBottom: 12,
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
  },
  retryBtn: {
    border: "none", background: "#9f1239", color: "#fff",
    padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 900, whiteSpace: "nowrap",
  },
};
