import React, { useState } from "react";
import API from "../api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [results, setResults] = useState([]);

  // 📅 Generate filtered report
  const generate = async () => {
    try {
      const res = await API.get("/orders");

      const data = res.data.filter((o) => {
        const orderDate = new Date(o.createdAt);

        let startDate = start ? new Date(start) : null;
        let endDate = end ? new Date(end) : null;

        // Normalize to full-day range
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

        if (startDate && orderDate < startDate) return false;
        if (endDate && orderDate > endDate) return false;

        return true;
      });

      setResults(data);
    } catch (err) {
      console.error("❌ Failed to fetch orders:", err);
      alert("Failed to fetch orders");
    }
  };


  // 📊 Export to Excel
  const downloadExcel = () => {
    if (results.length === 0) return alert("No data to export");

    // Calculate Totals
    const totalGrand = results.reduce((sum, r) => sum + (r.grandTotal || 0), 0);
    const totalPaid = results.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    const totalBalance = results.reduce((sum, r) => sum + (r.balanceAmount || 0), 0);

    // Calculate Payment Method Breakdown
    let cash = 0, card = 0, online = 0;
    results.forEach((r) => {
      const method = (r.paymentMethod || "Cash").toLowerCase();
      const paid = r.paidAmount || 0;
      if (method.includes("cash")) cash += paid;
      else if (method.includes("card")) card += paid;
      else online += paid; // Assume rest is Old/Online/UPI
    });

    // Format Data
    const data = results.map((r, i) => ({
      "No": i + 1,
      "Order No": r.orderNo,
      "Customer": r.customerName,
      "Date": new Date(r.createdAt).toLocaleString(),
      "Payment Method": r.paymentMethod || "Cash",
      "Status": r.status,
      "Total (₹)": r.grandTotal || 0,
      "Paid (₹)": r.paidAmount || 0,
      "Balance (₹)": r.balanceAmount || 0,
    }));

    // Add Summary Rows
    data.push(
      {}, // Empty row for spacing
      { "Order No": "SUMMARY REPORT" },
      { "Order No": "Total Revenue", "Total (₹)": totalGrand, "Paid (₹)": totalPaid, "Balance (₹)": totalBalance },
      { "Order No": "Cash Collection", "Paid (₹)": cash },
      { "Order No": "Card Collection", "Paid (₹)": card },
      { "Order No": "Online/Other", "Paid (₹)": online }
    );

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, "Nursery_Report.xlsx");
  };

  // 🧾 Export to PDF
  const downloadPDF = () => {
    if (results.length === 0) return alert("No data to export");

    const doc = new jsPDF();

    // Summary Calculations
    const totalGrand = results.reduce((sum, r) => sum + (r.grandTotal || 0), 0);
    const totalPaid = results.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    const totalBalance = results.reduce((sum, r) => sum + (r.balanceAmount || 0), 0);

    let cash = 0, card = 0, upi = 0, other = 0;
    results.forEach((r) => {
      const method = (r.paymentMethod || "Cash").toLowerCase();
      const paid = r.paidAmount || 0;
      if (method.includes("cash")) cash += paid;
      else if (method.includes("card")) card += paid;
      else if (method.includes("upi") || method.includes("online") || method.includes("phonepe") || method.includes("gpay")) upi += paid;
      else other += paid;
    });

    doc.setFontSize(14);
    doc.setTextColor(46, 125, 50);
    doc.text("Varashree Nursery - Sales Report", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`From: ${start || "All"}  To: ${end || "All"}`, 14, 22);

    const tableData = results.map((r, i) => [
      i + 1,
      r.orderNo,
      r.customerName,
      new Date(r.createdAt).toLocaleDateString(),
      `${r.paymentMethod || "Cash"} - ${r.status}`,
      `${r.grandTotal.toFixed(2)}`,
      `${(r.paidAmount || 0).toFixed(2)}`,
      `${(r.balanceAmount || 0).toFixed(2)}`,
    ]);

    // Add empty row
    tableData.push(["", "", "", "", "", "", "", ""]);

    // Add Summary Rows
    tableData.push([
      { content: "SUMMARY", colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totalGrand.toFixed(2), styles: { fontStyle: 'bold' } },
      { content: totalPaid.toFixed(2), styles: { fontStyle: 'bold' } },
      { content: totalBalance.toFixed(2), styles: { fontStyle: 'bold' } }
    ]);

    // Breakdown
    tableData.push(
      [{ content: "Cash Collection:", colSpan: 5, styles: { halign: 'right' } }, "", cash.toFixed(2), ""],
      [{ content: "Card Collection:", colSpan: 5, styles: { halign: 'right' } }, "", card.toFixed(2), ""],
      [{ content: "UPI/Online:", colSpan: 5, styles: { halign: 'right' } }, "", upi.toFixed(2), ""],
      [{ content: "Other:", colSpan: 5, styles: { halign: 'right' } }, "", other.toFixed(2), ""]
    );

    autoTable(doc, {
      startY: 28,
      head: [["No", "Order No", "Customer", "Date", "Info", "Total", "Paid", "Due"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [46, 125, 50] }, // green header
      styles: { fontSize: 9 },
      columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
      }
    });

    doc.save("Sales_Report.pdf");
  };

  return (
    <div className="container mt-4">
      <h2 className="fw-semibold text-success mb-4">
        📊 Date-wise Report Management
      </h2>

      <div className="card shadow-sm">
        <div className="card-body">
          {/* 🔹 Date Filters */}
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">End Date</label>
              <input
                type="date"
                className="form-control"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>

            <div className="col-md-4 d-flex align-items-end">
              <button onClick={generate} className="btn btn-primary w-100">
                <i className="bi bi-bar-chart"></i> Generate Report
              </button>
            </div>
          </div>

          {/* 🔹 Download Buttons */}
          {results.length > 0 && (
            <div className="d-flex justify-content-end mb-3 gap-2">
              <button className="btn btn-success" onClick={downloadExcel}>
                <i className="bi bi-file-earmark-excel"></i> Export Excel
              </button>
              <button className="btn btn-danger" onClick={downloadPDF}>
                <i className="bi bi-filetype-pdf"></i> Export PDF
              </button>
            </div>
          )}

          {/* 🔹 Report Table */}
          {results.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-success">
                  <tr>
                    <th>No</th>
                    <th>Order No</th>
                    <th>Customer</th>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Payment Info</th>
                    <th>Total (₹)</th>
                    <th>Paid (₹)</th>
                    <th>Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.id || i}>
                      <td>{i + 1}</td>
                      <td>{r.orderNo}</td>
                      <td>{r.customerName}</td>
                      <td>{r.employeeName || "-"}</td>
                      <td>{new Date(r.createdAt).toLocaleString()}</td>
                      <td>
                        <span className="badge bg-light text-dark border me-1">{r.paymentMethod || "Cash"}</span>
                        <span className={`badge ${r.status === "Paid" ? "bg-success" : "bg-warning text-dark"}`}>{r.status}</span>
                      </td>
                      <td className="fw-bold">
                        ₹ {r.grandTotal.toFixed(2)}
                      </td>
                      <td className="text-success fw-bold">
                        ₹ {(r.paidAmount || 0).toFixed(2)}
                      </td>
                      <td className="text-danger fw-bold">
                        ₹ {(r.balanceAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-muted py-4">
              <i className="bi bi-calendar-x fs-2 d-block mb-2"></i>
              No results to display. Select a date range and click{" "}
              <b>"Generate Report"</b>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
