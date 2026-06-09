import React, { useEffect, useState } from "react";
import API from "../api";

export default function PurchaseDashboard() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    plant: "",
    name: "",
    from: "",
    to: "",
  });

  const [parsedData, setParsedData] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const processPdf = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    setIsParsing(true);
    setParsedData(null);
    try {
      const res = await API.post("/orders/import-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const importedOrder = res.data.order;
      setParsedData(importedOrder);
      alert(`✅ Order ${importedOrder.orderNo} imported and saved successfully!`);
      load(); // Refresh sales report table!
    } catch (err) {
      console.error("❌ PDF import failed:", err);
      alert("❌ Failed to import PDF: " + (err.response?.data?.error || err.message));
    } finally {
      setIsParsing(false);
    }
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = ""; // Clear file input
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    await processPdf(selectedFile);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const handleCancel = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const load = async () => {
    const res = await API.get("/purchases", { params: filters });
    setData(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const downloadPDF = async () => {
    const res = await API.get("/purchases/pdf", {
      params: filters,
      responseType: "blob",
    });

    const blob = new Blob([res.data], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Filtered_Purchases.pdf";
    link.click();
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="text-success m-0">Sales Report</h3>
        <label className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 m-0" style={{ cursor: "pointer" }}>
          <input
            type="file"
            accept=".pdf"
            className="d-none"
            onChange={handlePdfUpload}
          />
          <i className="bi bi-file-earmark-pdf"></i>
          <span>Import PDF Invoice</span>
        </label>
      </div>

      {/* 📄 PDF Preview Modal */}
      {previewUrl && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: "16px" }}>
              <div className="modal-header bg-success text-white" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
                <h5 className="modal-title d-flex align-items-center gap-2 text-white">
                  <i className="bi bi-file-pdf-fill fs-4"></i> PDF Invoice Preview
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleCancel} disabled={isParsing}></button>
              </div>
              <div className="modal-body p-0" style={{ height: "550px" }}>
                <iframe
                  src={previewUrl}
                  width="100%"
                  height="100%"
                  style={{ border: "none" }}
                  title="PDF Preview"
                ></iframe>
              </div>
              <div className="modal-footer bg-light" style={{ borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
                <button type="button" className="btn btn-outline-danger" onClick={handleCancel} disabled={isParsing}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success d-flex align-items-center gap-2"
                  onClick={handleImport}
                  disabled={isParsing}
                >
                  {isParsing ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-file-earmark-check-fill"></i>
                      <span>Extract & Import Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extracted PDF Data Display */}
      {parsedData && (
        <div className="card border-primary shadow-sm mb-4">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-white">
              <i className="bi bi-file-earmark-check me-2"></i>Extracted Invoice Summary: {parsedData.orderNo || "N/A"}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setParsedData(null)} aria-label="Close"></button>
          </div>
          <div className="card-body">
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <strong>Customer Name:</strong> {parsedData.customerName || "-"}
              </div>
              <div className="col-md-4">
                <strong>Contact:</strong> {parsedData.customerContact || "-"}
              </div>
              <div className="col-md-4">
                <strong>Address:</strong> {parsedData.customerAddress || "-"}
              </div>
              <div className="col-md-4">
                <strong>Attended By:</strong> {parsedData.employeeName || "-"}
              </div>
              <div className="col-md-4">
                <strong>Payment Method:</strong> {parsedData.paymentMethod || "Cash"}
              </div>
              <div className="col-md-4">
                <strong>Order No:</strong> {parsedData.orderNo || "-"}
              </div>
            </div>

            <div className="table-responsive mb-3">
              <table className="table table-sm table-bordered mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Particulars</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Rate</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(parsedData.orderItems || parsedData.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.plantName}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end">₹ {item.rate.toFixed(2)}</td>
                      <td className="text-end">₹ {item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!parsedData.orderItems && !parsedData.items) || (parsedData.orderItems && parsedData.orderItems.length === 0) ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">No items extracted</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="row justify-content-end">
              <div className="col-md-4 text-end">
                <p className="mb-1">Subtotal: <strong>₹ {parsedData.subTotal.toFixed(2)}</strong></p>
                <p className="mb-1">Discount: <strong>₹ {parsedData.discount.toFixed(2)}</strong></p>
                <p className="mb-1 text-success">Grand Total: <strong>₹ {parsedData.grandTotal.toFixed(2)}</strong></p>
                <p className="mb-1">Paid Amount: <strong>₹ {parsedData.paidAmount.toFixed(2)}</strong></p>
                <p className="mb-0 text-danger">Balance Due: <strong>₹ {parsedData.balanceAmount.toFixed(2)}</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-sm-6 col-md-3">
          <input
            placeholder="Search Plant"
            className="form-control"
            onChange={(e) => setFilters({ ...filters, plant: e.target.value })}
          />
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <input
            placeholder="Customer Name"
            className="form-control"
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </div>
        <div className="col-6 col-md-2">
          <input type="date" className="form-control"
            onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div className="col-6 col-md-2">
          <input type="date" className="form-control"
            onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <div className="col-12 col-md-2 d-flex gap-2">
          <button className="btn btn-success flex-grow-1" onClick={load}>Search</button>
          <button className="btn btn-outline-danger" onClick={downloadPDF}>
            <i className="bi bi-file-earmark-pdf"></i> PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-bordered table-hover mb-0">
            <thead className="table-success text-nowrap">
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Total Amount</th>
                <th>Plants</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id}>
                  <td>{o.customerName}</td>
                  <td>{o.customerContact}</td>
                  <td className="text-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="fw-bold">₹ {o.grandTotal}</td>
                  <td className="small">
                    {o.orderItems.map((i) => (
                      <div key={i.id} className="text-nowrap">
                        • {i.plantName} <span className="text-muted">× {i.quantity}</span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    No sales found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
