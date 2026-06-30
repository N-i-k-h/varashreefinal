const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const { Sequelize } = require("sequelize");   // ✅ FIX ADDED
const { Order, OrderItem, Plant } = require("../models");
const path = require("path");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const upload = multer({ storage: multer.memoryStorage() });


// 🔧 Generate PDF invoice and stream to response
function generateInvoiceStream(order, items, res) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 30,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice_${order.orderNo}.pdf`
  );

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // ================= OUTER BORDER =================
  doc.rect(20, 20, pageWidth - 40, pageHeight - 40).stroke();

  // ================= HEADER (LOGO + TEXT SAME LINE) =================
  const logoPath = path.join(__dirname, "../assets/logo.png");

  if (require("fs").existsSync(logoPath)) {
    doc.image(logoPath, 40, 35, { width: 60 });
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("VARASHREE FARM & NURSERY", 110, 35, { align: "center" });

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(
      "Approved by Department of Horticulture, Government of Karnataka & Government of India\n" +
      "Spice Board & NHB Approved 3 Star Nursery\n" +
      "Sakrebyle, Gajanur Post, Shimoga Tq. & Dist, Karnataka\n" +
      "Mob: 7892326717, 9449742477, 7892023515 | Email: varashreenursery10@gmail.com",
      110,
      55
      , { align: "center" });

  // ================= CASH INVOICE BOX =================
  doc.rect(20, 115, pageWidth - 40, 25).stroke();
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("INVOICE", 0, 122, { align: "center" });

  // ================= CUSTOMER DETAILS =================
  let y = 155;
  doc.fontSize(10).font("Helvetica");
  doc.text(`Invoice No : ${order.orderNo}`, 40, y);
  doc.text(`Date : ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, 350, y);
  doc.text(`Payment Mode : ${order.paymentMethod || "Cash"}`, 350, y + 15);

  y += 15;
  doc.text(`Customer Name : ${order.customerName}`, 40, y);
  y += 15;
  doc.text(`Contact : ${order.customerContact || "-"}`, 40, y);
  y += 15;
  doc.text(`Address : ${order.customerAddress || "-"}`, 40, y);
  doc.text(`Attended By : ${order.employeeName || "-"}`, 350, y);

  // ================= TABLE =================
  y += 25;

  const tableX = 40;
  const col = {
    no: 40,
    item: 80,
    qty: 300,
    rate: 360,
    total: 440,
  };

  const rowHeight = 22;

  // Table Header
  doc.rect(tableX, y, pageWidth - 80, rowHeight).stroke();
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("No", col.no, y + 6);
  doc.text("Particulars", col.item, y + 6);
  doc.text("Qty", col.qty, y + 6);
  doc.text("Rate", col.rate, y + 6);
  doc.text("Total", col.total, y + 6);

  // Vertical Lines
  doc.moveTo(col.item - 10, y).lineTo(col.item - 10, y + rowHeight).stroke();
  doc.moveTo(col.qty - 10, y).lineTo(col.qty - 10, y + rowHeight).stroke();
  doc.moveTo(col.rate - 10, y).lineTo(col.rate - 10, y + rowHeight).stroke();
  doc.moveTo(col.total - 10, y).lineTo(col.total - 10, y + rowHeight).stroke();

  y += rowHeight;

  // Table Rows
  doc.font("Helvetica").fontSize(9);
  items.forEach((it, i) => {
    doc.rect(tableX, y, pageWidth - 80, rowHeight).stroke();

    doc.text(i + 1, col.no, y + 6);
    doc.text(it.plantName, col.item, y + 6, { width: 200 });
    doc.text(it.quantity.toString(), col.qty, y + 6);
    doc.text(it.rate.toFixed(2), col.rate, y + 6);
    doc.text(it.total.toFixed(2), col.total, y + 6);

    // Vertical Lines
    doc.moveTo(col.item - 10, y).lineTo(col.item - 10, y + rowHeight).stroke();
    doc.moveTo(col.qty - 10, y).lineTo(col.qty - 10, y + rowHeight).stroke();
    doc.moveTo(col.rate - 10, y).lineTo(col.rate - 10, y + rowHeight).stroke();
    doc.moveTo(col.total - 10, y).lineTo(col.total - 10, y + rowHeight).stroke();

    y += rowHeight;
  });

  const totalPlants = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // ================= TOTALS =================
  y += 15;
  doc.fontSize(10).font("Helvetica");
  doc.text("Total Plants :", 340, y);
  doc.text(totalPlants.toString(), 440, y);

  y += 15;
  doc.text("Subtotal :", 340, y);
  doc.text(order.subTotal.toFixed(2), 440, y);

  if (order.discount && order.discount > 0) {
    y += 15;
    doc.text("Discount :", 340, y);
    doc.text(order.discount.toFixed(2), 440, y);
  }

  y += 15;
  doc.font("Helvetica-Bold");
  doc.text("Grand Total :", 340, y);
  doc.text(order.grandTotal.toFixed(2), 440, y);

  y += 15;
  doc.text("Paid Amount :", 340, y);
  doc.text((order.paidAmount || 0).toFixed(2), 440, y);

  y += 15;
  doc.text("Balance Due :", 340, y);
  doc.text((order.balanceAmount || 0).toFixed(2), 440, y);


  // ================= CENTER TEXT BLOCK =================
  y += 30;
  doc
    .font("Helvetica-Oblique")
    .fontSize(9)
    .text(`Amount in words: ${convertToWords(order.grandTotal)} Rupees Only`, 0, y, {
      align: "center",
    });

  y += 15;
  doc
    .font("Helvetica")
    .fontSize(9)
    .text("Note: Plants once sold cannot be replaced or exchanged.", 0, y, {
      align: "center",
    });

  y += 15;
  doc
    .font("Helvetica-Bold")
    .text("Thank you for your business!", 0, y, { align: "center" });

  // ================= SIGNATURE =================
  y += 40;
  doc.font("Helvetica").fontSize(9);
  doc.text("For VARASHREE FARM & NURSERY", 350, y);
  y += 25;
  doc.text("Authorized Signatory", 350, y);

  doc.end();
}



// Convert number to words (Indian Format)
function convertToWords(amount) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

  function convertLessThanThousand(n) {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + " " + ones[n % 10];
    return ones[Math.floor(n / 100)] + " Hundred " + convertLessThanThousand(n % 100);
  }

  if (amount === 0) return "Zero";

  let num = Math.floor(amount);
  let result = "";

  if (num >= 10000000) {
    result += convertLessThanThousand(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }
  if (num >= 100000) {
    result += convertLessThanThousand(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }
  if (num >= 1000) {
    result += convertLessThanThousand(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }

  result += convertLessThanThousand(num);
  return result.trim();
}

// Retry handler
async function retryOnDeadlock(fn, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (error.original?.code === "ER_LOCK_DEADLOCK" && attempt < maxRetries) {
        console.log(`⚠️ Deadlock detected, retrying (${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
        continue;
      }

      throw error;
    }
  }
  throw lastError;
}

// ========================
//    GET ALL ORDERS
// ========================
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ Fetch orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ========================
//    GET ORDER BY ID
// ========================
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json(order);
  } catch (err) {
    console.error("❌ Fetch order error:", err);
    res.status(500).json({ error: "Error fetching order" });
  }
});

// ========================
//    CREATE NEW ORDER
// ========================
router.post("/", async (req, res) => {
  try {
    const payload = req.body;

    if (!payload.items || payload.items.length === 0) {
      return res.status(400).json({ error: "Order must include at least one item" });
    }

    const completedUpdates = [];
    try {
      // Sort items by plantId to prevent deadlocks (standard practice)
      const sortedItems = [...payload.items].sort((a, b) =>
        String(a.plantId).localeCompare(String(b.plantId))
      );

      for (const item of sortedItems) {
        // Atomic check and decrement stock
        const plant = await Plant.findOneAndUpdate(
          { _id: item.plantId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );

        if (!plant) {
          const exists = await Plant.findById(item.plantId);
          if (!exists) {
            throw new Error(`Plant not found: ${item.plantId}`);
          } else {
            throw new Error(
              `Insufficient stock for ${exists.plantName}. Available: ${exists.stock}, Requested: ${item.quantity}`
            );
          }
        }

        completedUpdates.push({ plantId: item.plantId, quantity: item.quantity });
      }

      const orderItems = payload.items.map((item) => ({
        plantId: item.plantId,
        plantName: item.plantName,
        rate: item.rate,
        quantity: item.quantity,
        total: item.total,
      }));

      const order = await Order.create({
        orderNo: payload.orderNo,
        customerName: payload.customerName,
        customerContact: payload.customerContact,
        customerAddress: payload.customerAddress,
        subTotal: payload.subTotal,
        discount: payload.discount || 0,
        tax: payload.tax || 0,
        grandTotal: payload.grandTotal,
        paidAmount: payload.paidAmount || 0,
        balanceAmount: payload.grandTotal - (payload.paidAmount || 0),
        status: (payload.grandTotal - (payload.paidAmount || 0)) <= 0 ? "Paid" : "Pending",
        finalPaymentDate: payload.finalPaymentDate || null,
        paymentMethod: payload.paymentMethod || "Cash",
        employeeName: payload.employeeName,
        orderItems: orderItems,
        createdAt: payload.createdAt || new Date(),
      });

      res.status(201).json({
        message: "Order created successfully",
        order,
        invoiceDownloadUrl: `/api/orders/${order.id}/invoice`,
      });
    } catch (error) {
      // Rollback completed stock updates
      for (const update of completedUpdates) {
        await Plant.findByIdAndUpdate(update.plantId, { $inc: { stock: update.quantity } });
      }
      throw error;
    }
  } catch (err) {
    console.error("❌ Order creation error:", err);
    res.status(400).json({
      error: err.message || "Failed to create order",
    });
  }
});

// ========================
//    DOWNLOAD INVOICE
// ========================
router.get("/:id/invoice", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    generateInvoiceStream(order, order.orderItems, res);
  } catch (err) {
    console.error("❌ Invoice generation error:", err);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

// ========================
//    UPDATE PAYMENT
// ========================
router.put("/:id/pay", async (req, res) => {
  try {
    const { paidAmount, finalPaymentDate } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ error: "Order not found" });

    const grandTotal = order.grandTotal;
    const newBalance = grandTotal - paidAmount;
    const newStatus = newBalance <= 0 ? "Paid" : "Pending";

    order.paidAmount = paidAmount;
    order.balanceAmount = newBalance;
    order.status = newStatus;

    if (finalPaymentDate !== undefined) {
      order.finalPaymentDate = finalPaymentDate;
    }

    await order.save();

    res.json({ message: "Payment updated", order });
  } catch (err) {
    console.error("❌ Payment update error:", err);
    res.status(500).json({ error: "Failed to update payment" });
  }
});

// ========================
//    DELETE ORDER
// ========================
// ========================
//    DELETE ORDER (CANCEL BILL)
// ========================
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Restore plant stock if the order wasn't already Cancelled
    if (order.status !== "Cancelled") {
      for (const item of order.orderItems) {
        await Plant.findByIdAndUpdate(item.plantId, { $inc: { stock: item.quantity } });
      }
      order.status = "Cancelled";
      await order.save();
    }

    res.json({ message: "Order cancelled successfully and stock restored", order });
  } catch (err) {
    console.error("❌ Delete/Cancel order error:", err);
    res.status(400).json({
      error: err.message || "Failed to cancel order",
    });
  }
});

// ========================
//    UPDATE ORDER (EDIT BILL)
// ========================
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const payload = req.body;
    const oldStatus = order.status;
    const newStatus = payload.status || oldStatus;

    const itemsChanged = payload.items !== undefined;
    const becameCancelled = (oldStatus !== "Cancelled" && newStatus === "Cancelled");
    const becameActive = (oldStatus === "Cancelled" && newStatus !== "Cancelled");
    const remainedActive = (oldStatus !== "Cancelled" && newStatus !== "Cancelled");

    if (itemsChanged) {
      if (remainedActive) {
        // Restore old stock
        for (const item of order.orderItems) {
          await Plant.findByIdAndUpdate(item.plantId, { $inc: { stock: item.quantity } });
        }

        // Deduct new stock
        const completedUpdates = [];
        try {
          const sortedItems = [...payload.items].sort((a, b) =>
            String(a.plantId).localeCompare(String(b.plantId))
          );

          for (const item of sortedItems) {
            const plant = await Plant.findOneAndUpdate(
              { _id: item.plantId, stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity } },
              { new: true }
            );

            if (!plant) {
              const exists = await Plant.findById(item.plantId);
              const name = exists ? exists.plantName : item.plantName || "Plant";
              const avail = exists ? exists.stock : 0;
              throw new Error(`Insufficient stock for ${name}. Available: ${avail}, Requested: ${item.quantity}`);
            }
            completedUpdates.push({ plantId: item.plantId, quantity: item.quantity });
          }
        } catch (error) {
          // Rollback new stock deductions
          for (const update of completedUpdates) {
            await Plant.findByIdAndUpdate(update.plantId, { $inc: { stock: update.quantity } });
          }
          // Re-deduct old stock
          for (const item of order.orderItems) {
            await Plant.findByIdAndUpdate(item.plantId, { $inc: { stock: -item.quantity } });
          }
          throw error;
        }

        // Update items
        order.orderItems = payload.items.map(item => ({
          plantId: item.plantId,
          plantName: item.plantName,
          rate: item.rate,
          quantity: item.quantity,
          total: item.total
        }));

      } else if (becameCancelled) {
        // Restore old stock, do NOT deduct new stock
        for (const item of order.orderItems) {
          await Plant.findByIdAndUpdate(item.plantId, { $inc: { stock: item.quantity } });
        }
        // Update items
        order.orderItems = payload.items.map(item => ({
          plantId: item.plantId,
          plantName: item.plantName,
          rate: item.rate,
          quantity: item.quantity,
          total: item.total
        }));

      } else if (becameActive) {
        // Deduct new stock (old was already restored when cancelled)
        const completedUpdates = [];
        try {
          const sortedItems = [...payload.items].sort((a, b) =>
            String(a.plantId).localeCompare(String(b.plantId))
          );

          for (const item of sortedItems) {
            const plant = await Plant.findOneAndUpdate(
              { _id: item.plantId, stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity } },
              { new: true }
            );

            if (!plant) {
              const exists = await Plant.findById(item.plantId);
              const name = exists ? exists.plantName : item.plantName || "Plant";
              const avail = exists ? exists.stock : 0;
              throw new Error(`Insufficient stock for ${name}. Available: ${avail}, Requested: ${item.quantity}`);
            }
            completedUpdates.push({ plantId: item.plantId, quantity: item.quantity });
          }
        } catch (error) {
          // Rollback new stock deductions
          for (const update of completedUpdates) {
            await Plant.findByIdAndUpdate(update.plantId, { $inc: { stock: update.quantity } });
          }
          throw error;
        }

        // Update items
        order.orderItems = payload.items.map(item => ({
          plantId: item.plantId,
          plantName: item.plantName,
          rate: item.rate,
          quantity: item.quantity,
          total: item.total
        }));

      } else { // remainedCancelled
        // Just update items, no stock changes
        order.orderItems = payload.items.map(item => ({
          plantId: item.plantId,
          plantName: item.plantName,
          rate: item.rate,
          quantity: item.quantity,
          total: item.total
        }));
      }

    } else {
      // Items not changed in payload, but status changed
      if (becameCancelled) {
        // Restore old stock
        for (const item of order.orderItems) {
          await Plant.findByIdAndUpdate(item.plantId, { $inc: { stock: item.quantity } });
        }
      } else if (becameActive) {
        // Deduct old stock
        const completedUpdates = [];
        try {
          const sortedItems = [...order.orderItems].sort((a, b) =>
            String(a.plantId).localeCompare(String(b.plantId))
          );

          for (const item of sortedItems) {
            const plant = await Plant.findOneAndUpdate(
              { _id: item.plantId, stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity } },
              { new: true }
            );

            if (!plant) {
              const exists = await Plant.findById(item.plantId);
              const name = exists ? exists.plantName : item.plantName || "Plant";
              const avail = exists ? exists.stock : 0;
              throw new Error(`Insufficient stock for ${name}. Available: ${avail}, Requested: ${item.quantity}`);
            }
            completedUpdates.push({ plantId: item.plantId, quantity: item.quantity });
          }
        } catch (error) {
          // Rollback deductions
          for (const update of completedUpdates) {
            await Plant.findByIdAndUpdate(update.plantId, { $inc: { stock: update.quantity } });
          }
          throw error;
        }
      }
    }

    // Update remaining properties
    if (payload.customerName !== undefined) order.customerName = payload.customerName;
    if (payload.customerContact !== undefined) order.customerContact = payload.customerContact;
    if (payload.customerAddress !== undefined) order.customerAddress = payload.customerAddress;
    if (payload.employeeName !== undefined) order.employeeName = payload.employeeName;
    if (payload.subTotal !== undefined) order.subTotal = payload.subTotal;
    if (payload.discount !== undefined) order.discount = payload.discount;
    if (payload.tax !== undefined) order.tax = payload.tax;
    if (payload.grandTotal !== undefined) order.grandTotal = payload.grandTotal;
    if (payload.paidAmount !== undefined) order.paidAmount = payload.paidAmount;
    if (payload.paymentMethod !== undefined) order.paymentMethod = payload.paymentMethod;
    if (payload.createdAt !== undefined) order.createdAt = new Date(payload.createdAt);

    // Compute balanceAmount and status
    order.balanceAmount = order.grandTotal - (order.paidAmount || 0);

    if (newStatus === "Cancelled") {
      order.status = "Cancelled";
    } else {
      order.status = order.balanceAmount <= 0 ? "Paid" : "Pending";
    }

    if (payload.finalPaymentDate !== undefined) {
      order.finalPaymentDate = payload.finalPaymentDate;
    }

    await order.save();
    res.json({ message: "Order updated successfully", order });
  } catch (err) {
    console.error("❌ Update order error:", err);
    res.status(400).json({ error: err.message || "Failed to update order" });
  }
});

// ========================
//    PARSE PDF INVOICE
// ========================
router.post("/parse-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const uint8 = new Uint8Array(req.file.buffer.buffer, req.file.buffer.byteOffset, req.file.buffer.byteLength);
    const parser = new pdfParse.PDFParse(uint8);
    const result = await parser.getText();
    const text = result.text;

    // Extracted Fields with lookahead assertions to prevent capturing columns on the same line
    const lookahead = "(?=\\s+Date|\\s+Payment Mode|\\s+Customer Name|\\s+Contact|\\s+Address|\\s+Attended By|[\\r\\n]|$)";
    const orderNoMatch = text.match(new RegExp(`Invoice No\\s*:\\s*(.+?)${lookahead}`, "i"));
    const customerNameMatch = text.match(new RegExp(`Customer Name\\s*:\\s*(.+?)${lookahead}`, "i"));
    const contactMatch = text.match(new RegExp(`Contact\\s*:\\s*(.+?)${lookahead}`, "i"));
    const addressMatch = text.match(new RegExp(`Address\\s*:\\s*(.+?)${lookahead}`, "i"));
    const employeeMatch = text.match(new RegExp(`Attended By\\s*:\\s*(.+?)${lookahead}`, "i"));
    const paymentModeMatch = text.match(new RegExp(`Payment Mode\\s*:\\s*(.+?)${lookahead}`, "i"));

    const subtotalMatch = text.match(/Subtotal\s*:\s*(?:Rs\.?\s*|₹\s*)?([\d\.,]+)/i);
    const discountMatch = text.match(/Discount\s*:\s*(?:Rs\.?\s*|₹\s*)?([\d\.,]+)/i);
    const grandTotalMatch = text.match(/Grand Total\s*:\s*(?:Rs\.?\s*|₹\s*)?([\d\.,]+)/i);
    const paidAmountMatch = text.match(/Paid Amount\s*:\s*(?:Rs\.?\s*|₹\s*)?([\d\.,]+)/i);
    const balanceMatch = text.match(/Balance Due\s*:\s*(?:Rs\.?\s*|₹\s*)?([\d\.,]+)/i);

    const items = [];
    const lines = text.split("\n");
    let inTable = false;

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;

      if (cleanLine.includes("Particulars") && cleanLine.includes("Qty") && cleanLine.includes("Total")) {
        inTable = true;
        continue;
      }

      if (cleanLine.startsWith("Subtotal") || cleanLine.startsWith("Sub Total") || cleanLine.includes("Subtotal :")) {
        inTable = false;
      }

      if (inTable) {
        // Match: index, plantName, qty, rate, total
        const itemMatch = cleanLine.match(/^(\d+)\s+(.+?)\s+(\d+)\s+([\d\.,]+)\s+([\d\.,]+)$/);
        if (itemMatch) {
          const quantity = parseInt(itemMatch[3], 10);
          const rate = parseFloat(itemMatch[4].replace(/,/g, ""));
          const total = parseFloat(itemMatch[5].replace(/,/g, ""));
          items.push({
            plantName: itemMatch[2].trim(),
            quantity,
            rate,
            total,
          });
        }
      }
    }

    res.json({
      orderNo: orderNoMatch ? orderNoMatch[1].trim() : "",
      customerName: customerNameMatch ? customerNameMatch[1].trim() : "",
      customerContact: contactMatch ? contactMatch[1].trim() : "",
      customerAddress: addressMatch ? addressMatch[1].trim() : "",
      employeeName: employeeMatch ? employeeMatch[1].trim() : "",
      paymentMethod: paymentModeMatch ? paymentModeMatch[1].trim() : "Cash",
      subTotal: subtotalMatch ? parseFloat(subtotalMatch[1].replace(/,/g, "")) : 0,
      discount: discountMatch ? parseFloat(discountMatch[1].replace(/,/g, "")) : 0,
      grandTotal: grandTotalMatch ? parseFloat(grandTotalMatch[1].replace(/,/g, "")) : 0,
      paidAmount: paidAmountMatch ? parseFloat(paidAmountMatch[1].replace(/,/g, "")) : 0,
      balanceAmount: balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, "")) : 0,
      items,
    });
  } catch (err) {
    console.error("❌ PDF Parsing Error:", err);
    res.status(500).json({ error: "Failed to parse PDF invoice" });
  }
});

// ========================
//    IMPORT PDF INVOICE
// ========================
router.post("/import-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const uint8 = new Uint8Array(req.file.buffer.buffer, req.file.buffer.byteOffset, req.file.buffer.byteLength);
    const parser = new pdfParse.PDFParse(uint8);
    const result = await parser.getText();
    const text = result.text;

    // Extracted Fields with lookahead assertions to prevent capturing columns on the same line
    const lookahead = "(?=\\s+Date|\\s+Payment Mode|\\s+Customer Name|\\s+Contact|\\s+Address|\\s+Attended By|[\\r\\n]|$)";
    const orderNoMatch = text.match(new RegExp(`Invoice No\\s*:\\s*(.+?)${lookahead}`, "i"));
    const customerNameMatch = text.match(new RegExp(`Customer Name\\s*:\\s*(.+?)${lookahead}`, "i"));
    const contactMatch = text.match(new RegExp(`Contact\\s*:\\s*(.+?)${lookahead}`, "i"));
    const addressMatch = text.match(new RegExp(`Address\\s*:\\s*(.+?)${lookahead}`, "i"));
    const employeeMatch = text.match(new RegExp(`Attended By\\s*:\\s*(.+?)${lookahead}`, "i"));
    const paymentModeMatch = text.match(new RegExp(`Payment Mode\\s*:\\s*(.+?)${lookahead}`, "i"));

    const subtotalMatch = text.match(/Subtotal\s*:\s*(?:Rs\.?\s*|₹\s*)?([\d\.,]+)/i);
    const discountMatch = text.match(/Discount\s*:\s*(?:Rs\.?\s*|₹\s*)?([\d\.,]+)/i);
    const grandTotalMatch = text.match(/Grand Total\s*:\s*(?:Rs\.?\s*|₹\s*)?([\d\.,]+)/i);
    const paidAmountMatch = text.match(/Paid Amount\s*:\s*(?:Rs\.?\s*|₹\s*)?([\d\.,]+)/i);
    const balanceMatch = text.match(/Balance Due\s*:\s*(?:Rs\.?\s*|₹\s*)?([\d\.,]+)/i);

    const items = [];
    const lines = text.split("\n");
    let inTable = false;

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;

      if (cleanLine.includes("Particulars") && cleanLine.includes("Qty") && cleanLine.includes("Total")) {
        inTable = true;
        continue;
      }

      if (cleanLine.startsWith("Subtotal") || cleanLine.startsWith("Sub Total") || cleanLine.includes("Subtotal :")) {
        inTable = false;
      }

      if (inTable) {
        // Match: index, plantName, qty, rate, total
        const itemMatch = cleanLine.match(/^(\d+)\s+(.+?)\s+(\d+)\s+([\d\.,]+)\s+([\d\.,]+)$/);
        if (itemMatch) {
          const quantity = parseInt(itemMatch[3], 10);
          const rate = parseFloat(itemMatch[4].replace(/,/g, ""));
          const total = parseFloat(itemMatch[5].replace(/,/g, ""));
          items.push({
            plantName: itemMatch[2].trim(),
            quantity,
            rate,
            total,
          });
        }
      }
    }

    // Auto-resolve or create plants
    const orderItems = [];
    for (const item of items) {
      let plant = await Plant.findOne({ plantName: new RegExp(`^${item.plantName}$`, "i") });
      if (!plant) {
        plant = await Plant.create({
          plantName: item.plantName,
          price: item.rate,
          stock: 0,
          category: "Imported",
        });
      }
      orderItems.push({
        plantId: plant._id,
        plantName: item.plantName,
        rate: item.rate,
        quantity: item.quantity,
        total: item.total,
      });
    }

    const orderNo = orderNoMatch ? orderNoMatch[1].trim() : `ORD-${Date.now()}`;
    const customerName = customerNameMatch ? customerNameMatch[1].trim() : "Imported Customer";
    const customerContact = contactMatch ? contactMatch[1].trim() : "";
    const customerAddress = addressMatch ? addressMatch[1].trim() : "";
    const employeeName = employeeMatch ? employeeMatch[1].trim() : "";
    const paymentMethod = paymentModeMatch ? paymentModeMatch[1].trim() : "Cash";

    const subTotal = subtotalMatch ? parseFloat(subtotalMatch[1].replace(/,/g, "")) : 0;
    const discount = discountMatch ? parseFloat(discountMatch[1].replace(/,/g, "")) : 0;
    const grandTotal = grandTotalMatch ? parseFloat(grandTotalMatch[1].replace(/,/g, "")) : 0;
    const paidAmount = paidAmountMatch ? parseFloat(paidAmountMatch[1].replace(/,/g, "")) : 0;
    const balanceAmount = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, "")) : 0;

    // Check if order already exists to prevent duplicate imports
    let existingOrder = await Order.findOne({ orderNo });
    if (existingOrder) {
      return res.status(400).json({ error: `Order with No. ${orderNo} already imported.` });
    }

    const order = await Order.create({
      orderNo,
      customerName,
      customerContact,
      customerAddress,
      subTotal,
      discount,
      grandTotal,
      paidAmount,
      balanceAmount,
      status: balanceAmount <= 0 ? "Paid" : "Pending",
      paymentMethod,
      employeeName,
      orderItems,
    });

    res.status(201).json({
      message: "Order imported and saved successfully",
      order,
    });
  } catch (err) {
    console.error("❌ PDF Import Error:", err);
    res.status(500).json({ error: "Failed to import PDF invoice: " + err.message });
  }
});

module.exports = router;
