const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateInvoice(order) {
  const doc = new PDFDocument({ margin: 40 });
  const filePath = path.join(
    __dirname,
    `../invoices/invoice_${order.orderNo}.pdf`
  );

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  /* ================= HEADER ================= */
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("VARASHREE FARM & NURSERY", { align: "center" });

  doc
    .fontSize(10)
    .font("Helvetica")
    .text(
      "Department of Horticulture Govt. of Karnataka & Govt. of India Approved\n" +
        "Spice Board & NHB Approved 3 Star Nursery\n" +
        "Sakebyle, Gajanur Post, Shimoga Tq. & Dist, Karnataka\n" +
        "Mob: 7892326717, 9449742477, 7892023515\n" +
        "Email: varashreenursery10@gmail.com",
      { align: "center" }
    );

  doc.moveDown();

  /* ================= INVOICE INFO ================= */
  doc.fontSize(12).font("Helvetica-Bold").text("CASH INVOICE", {
    align: "center",
  });

  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(10);
  doc.text(`Invoice No : ${order.orderNo}`);
  doc.text(
    `Date : ${new Date(order.createdAt || order.date).toLocaleDateString(
      "en-IN"
    )}`
  );
  doc.text(`Customer : ${order.customerName}`);
  doc.text(`Contact : ${order.customerContact || "-"}`);
  doc.text(`Address : ${order.customerAddress || "-"}`);

  doc.moveDown();

  /* ================= TABLE HEADER ================= */
  doc.font("Helvetica-Bold");
  doc.text("No", 50, doc.y, { width: 40 });
  doc.text("Particulars", 90, doc.y, { width: 200 });
  doc.text("Qty", 290, doc.y, { width: 50 });
  doc.text("Rate", 340, doc.y, { width: 80 });
  doc.text("Total", 420, doc.y, { width: 100, align: "right" });

  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(520, doc.y).stroke();
  doc.font("Helvetica");

  /* ================= ITEMS ================= */
  const items = order.items || order.orderItems || [];

  items.forEach((item, i) => {
    doc.text(i + 1, 50, doc.y + 5, { width: 40 });
    doc.text(item.plantName, 90, doc.y, { width: 200 });
    doc.text(item.quantity, 290, doc.y, { width: 50 });
    doc.text(Number(item.rate).toFixed(2), 340, doc.y, { width: 80 });
    doc.text(Number(item.total).toFixed(2), 420, doc.y, {
      width: 100,
      align: "right",
    });
    doc.moveDown();
  });

  doc.moveTo(50, doc.y).lineTo(520, doc.y).stroke();
  doc.moveDown();

  /* ================= TOTALS ================= */
  const subTotal = Number(order.subTotal || 0);
  const discount = Number(order.discount || 0);
  const grandTotal = Number(order.grandTotal || subTotal - discount);

  doc.font("Helvetica");
  doc.text(`Subtotal : ₹ ${subTotal.toFixed(2)}`, {
    align: "right",
  });

  doc.text(`Discount : ₹ ${discount.toFixed(2)}`, {
    align: "right",
  });

  doc.font("Helvetica-Bold").text(
    `Grand Total : ₹ ${grandTotal.toFixed(2)}`,
    { align: "right" }
  );

  doc.moveDown();

  /* ================= FOOTER ================= */
  doc
    .font("Helvetica-Oblique")
    .fontSize(9)
    .text("Note: Plants once sold cannot be replaced or exchanged.", {
      align: "center",
    });

  doc.end();

  return filePath;
}

module.exports = generateInvoice;
