import React, { useEffect, useRef, useState } from "react";
import {
  fetchDailyReport,
  exportReportPdf,
  importSalesData,
} from "../services/reportService";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchDailyReport();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      await importSalesData(file);
      await load();
      alert("Sales data imported successfully");
    } catch (err) {
      alert(err.message || "Import failed");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Reports</h2>
          <p style={styles.subtitle}>
            View daily pricing reports and export them as PDF.
          </p>
        </div>

        <div style={styles.actionsRow}>
          <button
            style={{ ...styles.secondaryBtn, opacity: importing ? 0.7 : 1 }}
            onClick={handleChooseFile}
            type="button"
            disabled={importing}
          >
            {importing ? "Importing..." : "Import Sales Data"}
          </button>

          <button
            style={styles.primaryBtn}
            onClick={handleExport}
            type="button"
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export Report (PDF)"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={handleImportFile}
          />
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

      <div style={styles.card}>
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
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={styles.emptyCell}>
                      No report data found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={index}>
                      <td style={styles.tdName}>{row.product_name || "-"}</td>
                      <td style={styles.td}>{row.cost}</td>
                      <td style={styles.td}>{row.competitor_price}</td>
                      <td style={styles.td}>{row.recommended_price}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 22, maxWidth: 1100 },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,
  },
  actionsRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  title: { margin: 0, fontSize: 34, fontWeight: 900, color: "#111827" },
  subtitle: { margin: "6px 0 0", color: "#6b7280", fontSize: 14 },

  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    border: "1px solid #eef2f7",
  },

  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  th: {
    textAlign: "left",
    padding: "12px 12px",
    fontSize: 13,
    color: "#475569",
    fontWeight: 900,
    borderBottom: "1px solid #eef2f7",
  },
  td: {
    padding: "14px 12px",
    fontSize: 14,
    color: "#111827",
    borderBottom: "1px solid #eef2f7",
  },
  tdName: {
    padding: "14px 12px",
    fontSize: 14,
    color: "#111827",
    fontWeight: 800,
    borderBottom: "1px solid #eef2f7",
  },
  emptyCell: {
    padding: 18,
    textAlign: "center",
    color: "#6b7280",
    fontStyle: "italic",
  },

  primaryBtn: {
    background: "#382372",
    border: "none",
    color: "#fff",
    borderRadius: 12,
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: "0 8px 18px rgba(56,35,114,0.22)",
    whiteSpace: "nowrap",
  },

  secondaryBtn: {
    background: "#4b93e7",
    border: "none",
    color: "#fff",
    borderRadius: 12,
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  loadingRow: { color: "#475569" },

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