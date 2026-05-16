import PDFDocument from "pdfkit";

// ── Colors ───────────────────────────────────────────────────────
const BRAND_PURPLE = "#382372";
const BRAND_MID    = "#6d4bb4";
const BRAND_LIGHT  = "#f5f3ff";
const TEXT_DARK    = "#111827";
const TEXT_MUTED   = "#6b7280";
const ROW_ALT      = "#faf9ff";
const BORDER       = "#e5e7eb";
const GREEN        = "#16a34a";
const YELLOW       = "#ca8a04";
const RED          = "#dc2626";

// ── Page dimensions ──────────────────────────────────────────────
const PAGE_W    = 595.28;
const PAGE_H    = 841.89;
const MARGIN    = 36;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ── Table columns ────────────────────────────────────────────────
const COLS = [
  { label: "Product",           x: MARGIN,       w: 148 },
  { label: "Cost (SAR)",        x: MARGIN + 148, w: 68  },
  { label: "Comp. Price (SAR)", x: MARGIN + 216, w: 80  },
  { label: "Recommended (SAR)", x: MARGIN + 296, w: 84  },
  { label: "Margin %",          x: MARGIN + 380, w: 60  },
  { label: "vs Market",         x: MARGIN + 440, w: 83  },
];

const ROW_H          = 26;
const TABLE_HEADER_H = 24;
const FOOTER_H       = 28;

// ── Helpers ──────────────────────────────────────────────────────
function seasonName(s) {
  return s?.season_name ?? s?.name ?? "Active Season";
}

function marginColor(pct) {
  if (pct >= 60) return GREEN;
  if (pct >= 35) return YELLOW;
  return RED;
}

function vsMarket(recommended, compPrice) {
  if (!compPrice || compPrice === 0)
    return { label: "N/A", color: TEXT_MUTED };
  const diff = ((recommended - compPrice) / compPrice) * 100;
  if (diff > 5)  return { label: "Above Market", color: RED   };
  if (diff < -5) return { label: "Below Market", color: GREEN };
  return { label: "Competitive", color: GREEN };
}

function sar(n) {
  return `SAR ${Number(n).toFixed(2)}`;
}

function resolveCost(prod, imp) {
  return Number(prod.variable_cost ?? prod.b_cost ?? imp.cost ?? 0);
}

// ── Main export ──────────────────────────────────────────────────
export function buildDailyReportPdf(reportData, res) {
  const { categories = [], fixedCosts = [], activeSeasons, activeSeason, importedMap = {} } = reportData;

  // Support both activeSeasons (array) and legacy activeSeason (single object)
  const seasons = Array.isArray(activeSeasons) && activeSeasons.length > 0
    ? activeSeasons
    : activeSeason ? [activeSeason] : [];
  const seasonLabel = seasons.length === 0
    ? null
    : seasons.length === 1
      ? seasonName(seasons[0])
      : seasons.map(seasonName).join(", ");

  // No bufferPages — draw footers dynamically instead
  const doc = new PDFDocument({ margin: MARGIN, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="pricewise-report.pdf"');
  doc.pipe(res);

  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });

  // ── Flatten all products for summary stats ───────────────────
  const allProducts = [];
  categories.forEach((cat) => {
    (cat.products || []).forEach((prod) => {
      const key         = prod.name?.trim().toLowerCase();
      const imp         = importedMap[key] || {};
      const cost        = resolveCost(prod, imp);
      const compPrice   = Number(prod.avg_competitor_price ?? prod.comp_price ?? imp.competitor_price ?? 0);
      const recommended = Number(prod.r_price ?? prod.recommended_price ?? 0);
      const margin      = recommended > 0 ? ((recommended - cost) / recommended) * 100 : 0;
      allProducts.push({ name: prod.name, cost, compPrice, recommended, margin });
    });
  });

  const totalProducts   = allProducts.length;
  const avgMargin       = totalProducts > 0
    ? allProducts.reduce((s, p) => s + p.margin, 0) / totalProducts : 0;
  const totalFixedCosts = fixedCosts.reduce((s, fc) => s + Number(fc.amount ?? 0), 0);
  const sorted          = [...allProducts].sort((a, b) => b.margin - a.margin);
  const topProduct      = sorted[0];
  const bottomProduct   = sorted[sorted.length - 1];

  // ── Page counter (for footer "Page X") ──────────────────────
  let pageNum = 0;

  // ── Draw footer on current page ──────────────────────────────
  function drawFooter() {
    doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H).fill(BRAND_PURPLE);
    doc.fillColor("#c4b5fd").fontSize(7.5).font("Helvetica")
      .text("© PriceWise  —  Confidential", MARGIN, PAGE_H - 18);
    doc.fillColor("#e0d7f8").fontSize(7.5)
      .text(`Page ${pageNum}`, MARGIN, PAGE_H - 18, { align: "right", width: CONTENT_W });
  }

  // ── Draw content page header ─────────────────────────────────
  function drawPageHeader() {
    pageNum++;
    doc.rect(0, 0, PAGE_W, 52).fill(BRAND_PURPLE);
    doc.fillColor("#fff").fontSize(16).font("Helvetica-Bold").text("PriceWise", MARGIN, 14);
    doc.fillColor("#c4b5fd").fontSize(8).font("Helvetica").text("Daily Pricing Report", MARGIN, 34);
    doc.fillColor("#e0d7f8").fontSize(8)
      .text(`${dateStr}  ·  ${timeStr}`, MARGIN, 20, { align: "right", width: CONTENT_W });
  }

  // ── Draw table column headers ─────────────────────────────────
  function drawTableHeader(yPos) {
    doc.rect(MARGIN, yPos, CONTENT_W, TABLE_HEADER_H).fill(BRAND_PURPLE);
    COLS.forEach((col) => {
      doc.fillColor("#fff").fontSize(7.5).font("Helvetica-Bold")
        .text(col.label, col.x + 4, yPos + 7, { width: col.w - 6 });
    });
    return yPos + TABLE_HEADER_H;
  }

  // ── Page break: draw footer, add page, draw new header ───────
  function checkPageBreak(yPos, needed = ROW_H) {
    if (yPos + needed > PAGE_H - FOOTER_H - 10) {
      drawFooter();
      doc.addPage();
      drawPageHeader();
      yPos = 62;
      yPos = drawTableHeader(yPos);
    }
    return yPos;
  }

  // ════════════════════════════════════════════════════════════
  // COVER PAGE
  // ════════════════════════════════════════════════════════════
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(BRAND_PURPLE);

  doc.fillColor("#fff").fontSize(48).font("Helvetica-Bold")
    .text("PriceWise", MARGIN, 290, { align: "center", width: CONTENT_W });
  doc.fillColor("#c4b5fd").fontSize(15).font("Helvetica")
    .text("Daily Pricing Report", MARGIN, 350, { align: "center", width: CONTENT_W });
  doc.moveTo(MARGIN + 100, 385).lineTo(PAGE_W - MARGIN - 100, 385)
    .strokeColor("#7c5dc7").lineWidth(1).stroke();
  doc.fillColor("#e0d7f8").fontSize(11)
    .text(`Generated on ${dateStr}`, MARGIN, 400, { align: "center", width: CONTENT_W });
  doc.fillColor("#c4b5fd").fontSize(10)
    .text(`at ${timeStr}`, MARGIN, 418, { align: "center", width: CONTENT_W });

  if (seasonLabel) {
    doc.roundedRect(MARGIN + 80, 448, CONTENT_W - 160, 30, 6).fill("#4c1d95");
    doc.fillColor("#fbbf24").fontSize(11).font("Helvetica-Bold")
      .text(`Active Season${seasons.length > 1 ? "s" : ""}: ${seasonLabel}`, MARGIN + 80, 458,
        { align: "center", width: CONTENT_W - 160 });
  }

  doc.fillColor("#7c5dc7").fontSize(8).font("Helvetica")
    .text("© PriceWise  —  Confidential Pricing Report", MARGIN, PAGE_H - 44,
      { align: "center", width: CONTENT_W });

  // ════════════════════════════════════════════════════════════
  // CONTENT PAGE 1
  // ════════════════════════════════════════════════════════════
  doc.addPage();
  drawPageHeader();
  let y = 62;

  // ── Executive summary cards ──────────────────────────────────
  const cards = [
    { label: "Total Products",    value: String(totalProducts)              },
    { label: "Avg Margin",        value: `${avgMargin.toFixed(1)}%`         },
    { label: "Total Fixed Costs", value: sar(totalFixedCosts)               },
    { label: "Top Performer",     value: topProduct    ? topProduct.name    : "—" },
    { label: "Needs Attention",   value: bottomProduct ? bottomProduct.name : "—" },
  ];

  const cardW = (CONTENT_W - 4 * 4) / 5;
  cards.forEach(({ label, value }, i) => {
    const cx = MARGIN + i * (cardW + 4);
    doc.roundedRect(cx, y, cardW, 48, 5).fill(BRAND_LIGHT);
    doc.fillColor(BRAND_PURPLE).fontSize(7).font("Helvetica")
      .text(label, cx + 6, y + 7, { width: cardW - 10 });
    doc.fillColor(TEXT_DARK).fontSize(11).font("Helvetica-Bold")
      .text(value, cx + 6, y + 20, { width: cardW - 10 });
  });
  y += 58;

  // ── Season notice ────────────────────────────────────────────
  if (seasonLabel) {
    doc.roundedRect(MARGIN, y, CONTENT_W, 22, 4).fill("#fef9c3");
    doc.fillColor("#854d0e").fontSize(8).font("Helvetica-Bold")
      .text(`Active Season${seasons.length > 1 ? "s" : ""}: ${seasonLabel}  —  Prices may reflect seasonal pricing adjustments.`,
        MARGIN + 8, y + 7, { width: CONTENT_W - 16 });
    y += 30;
  }

  // ── Top / Bottom performers panels ───────────────────────────
  if (totalProducts > 0) {
    const top3   = sorted.slice(0, 3);
    const bottom3 = [...sorted].reverse().slice(0, 3);
    const panelW  = (CONTENT_W - 8) / 2;
    const panelH  = 16 + top3.length * 15 + 6;

    doc.roundedRect(MARGIN, y, panelW, panelH, 5).fill("#f0fdf4");
    doc.fillColor(GREEN).fontSize(8).font("Helvetica-Bold")
      .text("Top Performers", MARGIN + 8, y + 6);
    top3.forEach((p, i) => {
      doc.fillColor(TEXT_DARK).fontSize(8).font("Helvetica")
        .text(`${i + 1}. ${p.name}`, MARGIN + 8, y + 18 + i * 15, { width: panelW - 70 });
      doc.fillColor(GREEN).fontSize(8).font("Helvetica-Bold")
        .text(`${p.margin.toFixed(0)}%`, MARGIN + panelW - 36, y + 18 + i * 15);
    });

    const bx = MARGIN + panelW + 8;
    doc.roundedRect(bx, y, panelW, panelH, 5).fill("#fff7ed");
    doc.fillColor(YELLOW).fontSize(8).font("Helvetica-Bold")
      .text("Needs Attention", bx + 8, y + 6);
    bottom3.forEach((p, i) => {
      doc.fillColor(TEXT_DARK).fontSize(8).font("Helvetica")
        .text(`${i + 1}. ${p.name}`, bx + 8, y + 18 + i * 15, { width: panelW - 70 });
      doc.fillColor(RED).fontSize(8).font("Helvetica-Bold")
        .text(`${p.margin.toFixed(0)}%`, bx + panelW - 36, y + 18 + i * 15);
    });

    y += panelH + 10;
  }

  // ── Table ────────────────────────────────────────────────────
  y = drawTableHeader(y);

  // ── Iterate categories ───────────────────────────────────────
  categories.forEach((cat) => {
    const products = cat.products || [];
    if (products.length === 0) return;

    y = checkPageBreak(y, 22);

    // Category header
    doc.rect(MARGIN, y, CONTENT_W, 20).fill(BRAND_MID);
    doc.fillColor("#fff").fontSize(8.5).font("Helvetica-Bold")
      .text(cat.name?.toUpperCase() || "UNCATEGORIZED", MARGIN + 8, y + 6,
        { width: CONTENT_W - 16 });
    y += 20;

    let catTotal = { cost: 0, recommended: 0, margin: 0, count: 0 };

    products.forEach((prod, idx) => {
      y = checkPageBreak(y);

      const key         = prod.name?.trim().toLowerCase();
      const imp         = importedMap[key] || {};
      const cost        = resolveCost(prod, imp);
      const compPrice   = Number(prod.avg_competitor_price ?? prod.comp_price ?? imp.competitor_price ?? 0);
      const recommended = Number(prod.r_price ?? prod.recommended_price ?? 0);
      const margin      = recommended > 0 ? ((recommended - cost) / recommended) * 100 : 0;
      const vm          = vsMarket(recommended, compPrice);

      catTotal.cost        += cost;
      catTotal.recommended += recommended;
      catTotal.margin      += margin;
      catTotal.count++;

      doc.rect(MARGIN, y, CONTENT_W, ROW_H).fill(idx % 2 === 0 ? "#fff" : ROW_ALT);
      doc.moveTo(MARGIN, y + ROW_H).lineTo(PAGE_W - MARGIN, y + ROW_H)
        .strokeColor(BORDER).lineWidth(0.4).stroke();

      doc.fillColor(TEXT_DARK).fontSize(8.5).font("Helvetica-Bold")
        .text(prod.name || "—", COLS[0].x + 4, y + 8, { width: COLS[0].w - 8 });
      doc.fillColor(TEXT_MUTED).fontSize(8.5).font("Helvetica")
        .text(sar(cost), COLS[1].x + 4, y + 8, { width: COLS[1].w - 8 });
      doc.fillColor(TEXT_MUTED).fontSize(8.5)
        .text(sar(compPrice), COLS[2].x + 4, y + 8, { width: COLS[2].w - 8 });
      doc.fillColor(TEXT_DARK).fontSize(8.5).font("Helvetica-Bold")
        .text(sar(recommended), COLS[3].x + 4, y + 8, { width: COLS[3].w - 8 });
      doc.fillColor(marginColor(margin)).fontSize(8.5).font("Helvetica-Bold")
        .text(`${margin.toFixed(0)}%`, COLS[4].x + 4, y + 8, { width: COLS[4].w - 8 });
      doc.fillColor(vm.color).fontSize(8).font("Helvetica")
        .text(vm.label, COLS[5].x + 4, y + 8, { width: COLS[5].w - 4 });

      y += ROW_H;
    });

    // Category summary row
    if (catTotal.count > 0) {
      y = checkPageBreak(y, 22);
      doc.rect(MARGIN, y, CONTENT_W, 20).fill("#ede9fe");
      doc.fillColor(BRAND_PURPLE).fontSize(7.5).font("Helvetica-Bold")
        .text(
          `${cat.name} Summary  ·  Avg Cost: ${sar(catTotal.cost / catTotal.count)}   Avg Recommended: ${sar(catTotal.recommended / catTotal.count)}   Avg Margin: ${(catTotal.margin / catTotal.count).toFixed(0)}%`,
          MARGIN + 8, y + 6, { width: CONTENT_W - 16 }
        );
      y += 26;
    }
  });

  // ── Footer on last content page ──────────────────────────────
  drawFooter();

  doc.end();
}