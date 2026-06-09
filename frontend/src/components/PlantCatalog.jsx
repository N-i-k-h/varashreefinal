import React, { useEffect, useState } from "react";
import API from "../api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PlantCatalog() {
  const [plants, setPlants] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    try {
      const res = await API.get("/plants");
      setPlants(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("❌ Failed to load plants:", err);
    }
  };

  useEffect(() => {
    const q = search.toLowerCase();
    const f = plants.filter(
      (p) =>
        p.plantName.toLowerCase().includes(q) ||
        (p.botanicalName && p.botanicalName.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
    setFiltered(f);
  }, [search, plants]);

  const downloadExcel = () => {
    const data = plants.map((p, i) => ({
      "Sl.No": i + 1,
      "Plant Name": p.plantName,
      "Botanical Name": p.botanicalName,
      Category: p.category,
      "Price (Rs.)": p.price,
      Stock: p.stock,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Plants");
    XLSX.writeFile(wb, "Plant_Catalog.xlsx");
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Plant Catalog", 14, 15);

      const tableData = plants.map((p, index) => [
        index + 1,
        p.plantName || "—",
        p.botanicalName || "—",
        p.category || "—",
        p.stock || 0,
        "Rs. " + (p.price || 0).toFixed(2),
      ]);

      autoTable(doc, {
        head: [["Sl.No", "Plant Name", "Botanical Name", "Category", "Stock", "Price"]],
        body: tableData,
        startY: 20,
      });

      doc.save("Plant_Catalog.pdf");
    } catch (err) {
      console.error("❌ PDF download failed:", err);
      alert("Failed to download PDF. Please try again.");
    }
  };

 return (
  <div className="container-fluid px-2 px-sm-3 px-md-4 mt-3">

    {/* Header Row */}
    <div className="row g-3 align-items-center mb-3">
      <div className="col-12 col-md-4">
        <h2 className="fw-semibold text-success text-center text-md-start">
          🌿 Plant Catalog
        </h2>
      </div>

      {/* Search + Buttons */}
      <div className="col-12 col-md-8">
        <div className="d-flex flex-column flex-sm-row justify-content-end align-items-stretch align-items-sm-center gap-2">

          <input
            type="text"
            className="form-control"
            placeholder="Search plants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            className="btn btn-outline-success w-100 w-sm-auto"
            onClick={downloadExcel}
          >
            📥 Excel
          </button>

          <button
            className="btn btn-outline-danger w-100 w-sm-auto"
            onClick={downloadPDF}
          >
            📄 PDF
          </button>
        </div>
      </div>
    </div>

    {/* Table Wrapper */}
   <div className="card shadow-sm">

  {/* FORCED Horizontal Scrolling (works on all phones) */}
  <div
    className="table-responsive"
    style={{
      overflowX: "auto",
      overflowY: "hidden",
      display: "block",
      width: "100%",
      maxWidth: "100vw",
      whiteSpace: "nowrap",
      WebkitOverflowScrolling: "touch" // smooth iOS scrolling
    }}
  >
    <table className="table table-hover table-bordered align-middle mb-0">
      <thead className="table-success">
        <tr>
          <th>Sl.No</th>
          <th>Plant Name</th>
          <th>Botanical Name</th>
          <th>Category</th>
          <th>Stock</th>
          <th>Price (Rs.)</th>
        </tr>
      </thead>

      <tbody>
        {filtered.map((p, idx) => (
          <tr key={p.id}>
            <td>{idx + 1}</td>
            <td className="text-wrap">{p.plantName}</td>
            <td className="text-wrap">{p.botanicalName || "—"}</td>
            <td>{p.category || "—"}</td>
            <td>{p.stock}</td>
            <td>Rs. {p.price?.toFixed(2)}</td>
          </tr>
        ))}

        {filtered.length === 0 && (
          <tr>
            <td colSpan="6" className="text-center text-muted py-4">
              <i className="bi bi-flower2 fs-2 d-block mb-2"></i>
              No plants found.
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
