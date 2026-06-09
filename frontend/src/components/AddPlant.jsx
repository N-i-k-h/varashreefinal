import React, { useState } from "react";
import API from "../api";
import * as XLSX from "xlsx";


export default function AddPlant() {
  const [form, setForm] = useState({
    plantName: "",
    botanicalName: "",
    description: "",
    price: 0,
    stock: 0,
    size: "",
    category: "",
    image: null, // change from string to file
  });

  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [colMapping, setColMapping] = useState({
    plantName: "",
    price: "",
    stock: "",
    botanicalName: "",
    category: "",
    size: "",
    description: "",
    light: "",
    water: ""
  });
  const [showMapper, setShowMapper] = useState(false);

  const processExcel = async (file) => {
    if (!colMapping.plantName) {
      return alert("❌ Plant Name column mapping is required.");
    }
    if (!colMapping.price) {
      return alert("❌ Price column mapping is required.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(colMapping));

    setImporting(true);
    try {
      const res = await API.post("/plants/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(`✅ Plants imported successfully!\nCreated: ${res.data.created}\nUpdated: ${res.data.updated}`);
      setShowMapper(false);
      setSelectedFile(null);
    } catch (err) {
      console.error("❌ Import failed:", err);
      alert("❌ Import failed: " + (err?.response?.data?.error || err.message));
    } finally {
      setImporting(false);
    }
  };

  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = json[0] || [];
        
        const cleanHeaders = headers.map(h => String(h).trim()).filter(Boolean);
        setExcelHeaders(cleanHeaders);

        // Auto-map headers
        const mapping = {
          plantName: "",
          price: "",
          stock: "",
          botanicalName: "",
          category: "",
          size: "",
          description: "",
          light: "",
          water: ""
        };

        cleanHeaders.forEach(h => {
          const clean = String(h).trim().toLowerCase().replace(/[\s\._-]/g, "");
          if (clean === "plantname" || clean === "name" || clean === "particulars") {
            mapping.plantName = h;
          } else if (clean === "price" || clean === "rate" || clean === "price(rs)" || clean === "price(rs.)") {
            mapping.price = h;
          } else if (clean === "stock" || clean === "quantity" || clean === "qty") {
            mapping.stock = h;
          } else if (clean === "botanicalname" || clean === "botanical") {
            mapping.botanicalName = h;
          } else if (clean === "category") {
            mapping.category = h;
          } else if (clean === "size") {
            mapping.size = h;
          } else if (clean === "description" || clean === "desc" || clean === "details") {
            mapping.description = h;
          } else if (clean === "light" || clean === "sunlight") {
            mapping.light = h;
          } else if (clean === "water" || clean === "watering") {
            mapping.water = h;
          }
        });

        setColMapping(mapping);
        setShowMapper(true);
      } catch (err) {
        console.error("❌ Failed to parse Excel:", err);
        alert("Failed to parse Excel file headers.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // Clear file input
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    await processExcel(selectedFile);
  };

  const handleCancel = () => {
    setShowMapper(false);
    setSelectedFile(null);
  };

  const submit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    try {
      await API.post("/plants", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Plant added successfully!");
      setForm({
        plantName: "",
        botanicalName: "",
        description: "",
        price: 0,
        stock: 0,
        size: "",
        category: "",
        image: null,
      });
    } catch (err) {
      alert("❌ Error: " + (err?.response?.data?.error || err.message));
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-success m-0">Add Plant</h2>
        <label className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 m-0" style={{ cursor: "pointer" }}>
          <input
            type="file"
            accept=".xlsx, .xls"
            className="d-none"
            onChange={handleExcelImport}
          />
          <i className="bi bi-file-earmark-excel"></i>
          <span>Bulk Import (Excel)</span>
        </label>
      </div>

      {/* 📊 Excel Column Mapping Modal */}
      {showMapper && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: "16px" }}>
              <div className="modal-header bg-success text-white" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
                <h5 className="modal-title d-flex align-items-center gap-2 text-white">
                  <i className="bi bi-file-earmark-spreadsheet-fill fs-4"></i> Map Excel Columns
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleCancel} disabled={importing}></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: "400px", overflowY: "auto" }}>
                <p className="text-muted small mb-3">
                  Match each plant attribute field with the corresponding column header in your Excel sheet.
                </p>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-bold">Plant Name *</label>
                    <select
                      className="form-select border-primary"
                      value={colMapping.plantName}
                      onChange={(e) => setColMapping({ ...colMapping, plantName: e.target.value })}
                      required
                    >
                      <option value="">-- Select Column --</option>
                      {excelHeaders.map((h, i) => (
                        <option key={i} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold">Price / Rate *</label>
                    <select
                      className="form-select border-primary"
                      value={colMapping.price}
                      onChange={(e) => setColMapping({ ...colMapping, price: e.target.value })}
                      required
                    >
                      <option value="">-- Select Column --</option>
                      {excelHeaders.map((h, i) => (
                        <option key={i} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold">Stock / Qty</label>
                    <select
                      className="form-select"
                      value={colMapping.stock}
                      onChange={(e) => setColMapping({ ...colMapping, stock: e.target.value })}
                    >
                      <option value="">-- Skip Column --</option>
                      {excelHeaders.map((h, i) => (
                        <option key={i} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold">Botanical Name</label>
                    <select
                      className="form-select"
                      value={colMapping.botanicalName}
                      onChange={(e) => setColMapping({ ...colMapping, botanicalName: e.target.value })}
                    >
                      <option value="">-- Skip Column --</option>
                      {excelHeaders.map((h, i) => (
                        <option key={i} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold">Category</label>
                    <select
                      className="form-select"
                      value={colMapping.category}
                      onChange={(e) => setColMapping({ ...colMapping, category: e.target.value })}
                    >
                      <option value="">-- Skip Column --</option>
                      {excelHeaders.map((h, i) => (
                        <option key={i} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold">Size</label>
                    <select
                      className="form-select"
                      value={colMapping.size}
                      onChange={(e) => setColMapping({ ...colMapping, size: e.target.value })}
                    >
                      <option value="">-- Skip Column --</option>
                      {excelHeaders.map((h, i) => (
                        <option key={i} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold">Description</label>
                    <select
                      className="form-select"
                      value={colMapping.description}
                      onChange={(e) => setColMapping({ ...colMapping, description: e.target.value })}
                    >
                      <option value="">-- Skip Column --</option>
                      {excelHeaders.map((h, i) => (
                        <option key={i} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold">Light Requirement</label>
                    <select
                      className="form-select"
                      value={colMapping.light}
                      onChange={(e) => setColMapping({ ...colMapping, light: e.target.value })}
                    >
                      <option value="">-- Skip Column --</option>
                      {excelHeaders.map((h, i) => (
                        <option key={i} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-bold">Water Requirement</label>
                    <select
                      className="form-select"
                      value={colMapping.water}
                      onChange={(e) => setColMapping({ ...colMapping, water: e.target.value })}
                    >
                      <option value="">-- Skip Column --</option>
                      {excelHeaders.map((h, i) => (
                        <option key={i} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light" style={{ borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
                <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleCancel} disabled={importing}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm d-flex align-items-center gap-2"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill"></i>
                      <span>Import Catalog</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-header bg-success text-white">
          <div className="h4 mb-0 text-white">Add New Plant</div>
        </div>
        <div className="card-body">
          <form onSubmit={submit} encType="multipart/form-data">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Plant Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.plantName}
                  onChange={(e) =>
                    setForm({ ...form, plantName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Botanical Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.botanicalName}
                  onChange={(e) =>
                    setForm({ ...form, botanicalName: e.target.value })
                  }
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Price (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Stock</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: Number(e.target.value) })
                  }
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Size</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>

              {/* 🖼️ Image upload */}
              <div className="col-12">
                <label className="form-label">Upload Image</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={(e) =>
                    setForm({ ...form, image: e.target.files[0] })
                  }
                />
              </div>

              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                ></textarea>
              </div>

              <div className="col-12 text-end">
                <button type="submit" className="btn btn-success px-4">
                  <i className="bi bi-check-circle me-2"></i>Submit
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
