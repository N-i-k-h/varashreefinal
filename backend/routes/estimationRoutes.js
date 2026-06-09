const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const { Estimation, EstimationItem } = require("../models/Estimation");

/* ======================================
   NUMBER → WORDS (Indian Format)
====================================== */
function convertToWords(num) {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const c = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

  const inWords = (n) => {
    if (n < 10) return a[n];
    if (n < 20) return c[n - 10];
    if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred " + inWords(n % 100);
    return "";
  };

  if (!num) return "Zero";
  return inWords(Math.floor(num)).trim() + " Rupees Only";
}

/* ======================================
   PDF GENERATOR (ORDER LAYOUT → ESTIMATE)
====================================== */
function generateEstimationPDF(estimation, items, res) {
  const doc = new PDFDocument({ size: "A4", margin: 30 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=estimate_${estimation.estimateNo}.pdf`
  );

  doc.pipe(res);

  const pageWidth = doc.page.width;

  // Outer Border
  doc.rect(20, 20, pageWidth - 40, doc.page.height - 40).stroke();

  // Logo
  const logoPath = path.join(__dirname, "../assets/logo.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 40, 35, { width: 60 });
  }

  // Header
  doc.font("Helvetica-Bold").fontSize(16)
    .text("VARASHREE FARM & NURSERY", 110, 35, { align: "center" });

  doc.font("Helvetica").fontSize(9)
    .text(
      "Approved by Department of Horticulture, Government of Karnataka & Government of India\n" +
      "Spice Board & NHB Approved 3 Star Nursery\n" +
      "Sakrebyle, Gajanur Post, Shimoga Tq. & Dist, Karnataka\n" +
      "Mob: 7892326717, 9449742477 | Email: varashreenursery10@gmail.com",
      110, 55, { align: "center" }
    );

  // Title
  doc.rect(20, 115, pageWidth - 40, 25).stroke();
  doc.font("Helvetica-Bold").fontSize(12)
    .text("ESTIMATE", 0, 122, { align: "center" });

  // Customer Info
  let y = 155;
  doc.fontSize(10).font("Helvetica");
  doc.text(`Estimate No : ${estimation.estimateNo}`, 40, y);
  doc.text(`Date : ${new Date(estimation.createdAt).toLocaleDateString("en-IN")}`, 350, y);

  y += 15;
  doc.text(`Customer Name : ${estimation.customerName}`, 40, y);
  y += 15;
  doc.text(`Contact : ${estimation.customerContact || "-"}`, 40, y);
  y += 15;
  doc.text(`Address : ${estimation.customerAddress || "-"}`, 40, y);

  // Table
  // ================= TABLE =================
y += 25;

const tableX = 40;
const tableWidth = pageWidth - 80;
const rowHeight = 22;

// Column positions
const col = {
  no: tableX,
  item: tableX + 40,
  qty: tableX + 260,
  rate: tableX + 320,
  total: tableX + 400,
  end: tableX + tableWidth,
};

// -------- Header Row --------
doc.rect(tableX, y, tableWidth, rowHeight).stroke();

doc.font("Helvetica-Bold").fontSize(10);
doc.text("No", col.no + 5, y + 6);
doc.text("Particulars", col.item + 5, y + 6);
doc.text("Qty", col.qty + 5, y + 6);
doc.text("Rate", col.rate + 5, y + 6);
doc.text("Total", col.total + 5, y + 6);

// Vertical header lines
[ col.item, col.qty, col.rate, col.total ].forEach(x => {
  doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
});

y += rowHeight;

// -------- Table Rows --------
doc.font("Helvetica").fontSize(9);

items.forEach((it, i) => {
  doc.rect(tableX, y, tableWidth, rowHeight).stroke();

  doc.text(i + 1, col.no + 5, y + 6);
  doc.text(it.plantName, col.item + 5, y + 6, { width: 190 });
  doc.text(it.quantity.toString(), col.qty + 5, y + 6);
  doc.text(it.rate.toFixed(2), col.rate + 5, y + 6);
  doc.text(it.total.toFixed(2), col.total + 5, y + 6);

  // Vertical row lines
  [ col.item, col.qty, col.rate, col.total ].forEach(x => {
    doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
  });

  y += rowHeight;
});


  const totalPlants = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Total
  y += 20;
  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("Total Plants :", 340, y);
  doc.text(totalPlants.toString(), 440, y);

  y += 20;
  doc.text("Estimated Cost :", 340, y);
  doc.text(` ${estimation.grandTotal.toFixed(2)}`, 440, y);

  // Footer
  y += 30;
  doc.font("Helvetica-Oblique").fontSize(9)
    .text(`Amount in words: ${convertToWords(estimation.grandTotal)}`, 0, y, { align: "center" });

  y += 30;
  doc.font("Helvetica").fontSize(9)
    .text("This is an estimate only. Prices may change.", 0, y, { align: "center" });

  doc.end();
}

/* ======================================
   CREATE ESTIMATION
   ====================================== */
router.post("/", async (req, res) => {
  try {
    const { estimateNo, customerName, customerContact, customerAddress, items, grandTotal } = req.body;

    const formattedItems = items.map((item) => ({
      plantId: item.plantId || null,
      plantName: item.plantName,
      rate: item.rate,
      quantity: item.quantity,
      total: item.total,
    }));

    const estimation = await Estimation.create({
      estimateNo,
      customerName,
      customerContact,
      customerAddress,
      totalItems: items.length,
      grandTotal,
      items: formattedItems,
    });

    res.json({ estimation });
  } catch (err) {
    console.error("❌ Estimation failed:", err);
    res.status(500).json({ error: "Estimation failed" });
  }
});

/* ======================================
   GET ALL ESTIMATIONS
   ====================================== */
router.get("/", async (req, res) => {
  try {
    const estimations = await Estimation.find().sort({ createdAt: -1 });
    res.json(estimations);
  } catch (err) {
    console.error("❌ Fetch estimations error:", err);
    res.status(500).json({ error: "Failed to fetch estimations" });
  }
});

/* ======================================
   DOWNLOAD PDF
   ====================================== */
router.get("/:id/pdf", async (req, res) => {
  try {
    const estimation = await Estimation.findById(req.params.id);

    if (!estimation) return res.status(404).json({ error: "Not found" });

    generateEstimationPDF(estimation, estimation.items, res);
  } catch (err) {
    console.error("❌ PDF error:", err);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

module.exports = router;
