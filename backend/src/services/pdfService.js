import PDFDocument from "pdfkit";

export function buildDailyReportPdf(reportRows, res) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="daily-pricing-report.pdf"');

  doc.pipe(res);

  doc
    .fontSize(20)
    .text("Daily Pricing Report", { align: "center" })
    .moveDown(1.5);

  const tableTop = doc.y;
  const col1 = 50;
  const col2 = 220;
  const col3 = 320;
  const col4 = 450;

  doc.fontSize(12).font("Helvetica-Bold");
  doc.text("Product", col1, tableTop);
  doc.text("Cost", col2, tableTop);
  doc.text("Competitor Price", col3, tableTop);
  doc.text("Recommended Price", col4, tableTop);

  doc.moveTo(40, tableTop + 18).lineTo(555, tableTop + 18).stroke();

  let y = tableTop + 28;
  doc.font("Helvetica").fontSize(11);

  reportRows.forEach((row) => {
    if (y > 740) {
      doc.addPage();
      y = 50;
    }

    doc.text(String(row.product_name ?? "-"), col1, y, { width: 150 });
    doc.text(String(row.cost ?? "-"), col2, y);
    doc.text(String(row.competitor_price ?? "-"), col3, y);
    doc.text(String(row.recommended_price ?? "-"), col4, y);

    y += 24;
  });

  doc.end();
}