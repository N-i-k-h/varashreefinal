import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";

export default function ManagePlants() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // 🧩 Load plants
  const fetchPlants = async () => {
    try {
      const res = await API.get("/plants");
      setPlants(res.data);
    } catch (err) {
      console.error("❌ Failed to load plants:", err);
    } finally {
      setLoading(false);
    }
  };

  // 📦 Run when page loads OR when redirected after edit
  useEffect(() => {
    fetchPlants();

    // 🪄 Trigger reload when coming from EditPlant
    if (location.state?.updated) {
      console.log("♻️ Refreshing plants after update...");
      fetchPlants();
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const remove = async (id) => {
    if (!window.confirm("Delete this plant?")) return;
    try {
      await API.delete(`/plants/${id}`);
      setPlants((prev) => prev.filter((p) => p.id !== id));
      alert("✅ Plant deleted successfully!");
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert("Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-2 text-muted">Loading plants...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4 fw-semibold text-success">Manage Plants</h2>

      <div className="card shadow-sm">
        <div className="card-body table-responsive">
          <table className="table table-striped align-middle">
            <thead className="table-success">
              <tr>
                <th scope="col">Sl.No</th>
                <th scope="col">Name</th>
                <th scope="col">Price (₹)</th>
                <th scope="col">Stock</th>
                <th scope="col" className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plants.length > 0 ? (
                plants.map((p, index) => (
                  <tr key={p.id}>
                    <td>{index + 1}</td>
                    <td>{p.plantName}</td>
                    <td>₹ {p.price.toFixed(2)}</td>
                    <td>{p.stock}</td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={() =>
                          navigate(`/plants/edit/${p.id}`, {
                            state: { from: "/plants/manage" },
                          })
                        }
                      >
                        <i className="bi bi-pencil-square me-1"></i>Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => remove(p.id)}
                      >
                        <i className="bi bi-trash me-1"></i>Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-3">
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