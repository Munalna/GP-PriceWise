import PDFDocument from "pdfkit";

const BRAND_PURPLE = "#382372";
const BRAND_LIGHT = "#f5f3ff";
const TEXT_DARK = "#111827";
const TEXT_MUTED = "#6b7280";
const ROW_ALT = "#faf9ff";
const BORDER = "#e5e7eb";

export function buildDailyReportPdf(rows, res) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="pricewise-report.pdf"'
  );
  doc.pipe(res);

  // ── Header bar ──────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 80).fill(BRAND_PURPLE);

  doc
    .fillColor("#fff")
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("PriceWise", 40, 22);

  doc
    .fillColor("#c4b5fd")
    .fontSize(10)
    .font("Helvetica")
    .text("Daily Pricing Report", 40, 50);

  // Date & time (right side of header)
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  doc
    .fillColor("#e0d7f8")
    .fontSize(9)
    .text(`Generated: ${dateStr}`, 40, 22, { align: "right", width: doc.page.width - 80 });

  doc
    .fillColor("#c4b5fd")
    .fontSize(9)
    .text(`at ${timeStr}`, 40, 35, { align: "right", width: doc.page.width - 80 });

  // ── Summary cards ────────────────────────────────────────────
  const totalProducts = rows.length;
  const avgCost =
    totalProducts > 0
      ? (rows.reduce((s, r) => s + Number(r.cost || 0), 0) / totalProducts).toFixed(2)
      : "0.00";
  const avgRecommended =
    totalProducts > 0
      ? (
          rows.reduce((s, r) => s + Number(r.recommended_price || 0), 0) /
          totalProducts
        ).toFixed(2)
      : "0.00";

  const cardY = 100;
  const cardW = 155;
  const cardH = 55;
  const cards = [
    { label: "Total Products", value: totalProducts, x: 40 },
    { label: "Avg Cost", value: `SAR ${avgCost}`, x: 210 },
    { label: "Avg Recommended Price", value: `SAR ${avgRecommended}`, x: 380 },
  ];

  cards.forEach(({ label, value, x }) => {
    doc.roundedRect(x, cardY, cardW, cardH, 8).fill(BRAND_LIGHT);
    doc.fillColor(BRAND_PURPLE).fontSize(9).font("Helvetica").text(label, x + 10, cardY + 10, { width: cardW - 20 });
    doc.fillColor(TEXT_DARK).fontSize(16).font("Helvetica-Bold").text(String(value), x + 10, cardY + 26);
  });

  // ── Table ────────────────────────────────────────────────────
  const tableTop = cardY + cardH + 24;
  const colX = [40, 185, 330, 460];
  const colW = [140, 140, 125, 110];
  const headers = ["Product", "Cost (SAR)", "Competitor Price (SAR)", "Recommended (SAR)"];

  // Table header row
  doc.rect(40, tableTop, doc.page.width - 80, 26).fill(BRAND_PURPLE);

  headers.forEach((h, i) => {
    doc
      .fillColor("#fff")
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(h, colX[i] + 6, tableTop + 8, { width: colW[i] - 6 });
  });

  // Table rows
  let y = tableTop + 26;

  if (rows.length === 0) {
    doc
      .rect(40, y, doc.page.width - 80, 32)
      .fill("#fff");
    doc
      .fillColor(TEXT_MUTED)
      .fontSize(10)
      .font("Helvetica")
      .text("No report data found.", 40, y + 10, {
        align: "center",
        width: doc.page.width - 80,
      });
    y += 32;
  }

  rows.forEach((row, idx) => {
    const rowH = 28;
    const bg = idx % 2 === 0 ? "#fff" : ROW_ALT;

    doc.rect(40, y, doc.page.width - 80, rowH).fill(bg);

    // Bottom border
    doc.moveTo(40, y + rowH).lineTo(doc.page.width - 40, y + rowH).stroke(BORDER);

    const cells = [
      row.product_name || "-",
      String(row.cost ?? "-"),
      String(row.competitor_price ?? "-"),
      String(row.recommended_price ?? "-"),
    ];

    cells.forEach((cell, i) => {
      doc
        .fillColor(i === 0 ? TEXT_DARK : TEXT_MUTED)
        .fontSize(9.5)
        .font(i === 0 ? "Helvetica-Bold" : "Helvetica")
        .text(cell, colX[i] + 6, y + 9, { width: colW[i] - 8 });
    });

    y += rowH;
  });

  // ── Footer ───────────────────────────────────────────────────
  const footerY = doc.page.height - 36;
  doc.rect(0, footerY, doc.page.width, 36).fill(BRAND_PURPLE);

  doc
    .fillColor("#c4b5fd")
    .fontSize(8)
    .font("Helvetica")
    .text("© PriceWise — Confidential", 40, footerY + 12);

  doc
    .fillColor("#e0d7f8")
    .fontSize(8)
    .text("Page 1 of 1", 40, footerY + 12, {
      align: "right",
      width: doc.page.width - 80,
    });

  doc.end();
}