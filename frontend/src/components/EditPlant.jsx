import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api";

export default function EditPlant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    plantName: "",
    botanicalName: "",
    description: "",
    price: 0,
    stock: 0,
    size: "",
    category: "",
    image: null,
  });
  const [preview, setPreview] = useState("");

  // 🧩 Load plant data
  useEffect(() => {
    API.get(`/plants/${id}`)
      .then((r) => {
        setForm(r.data);
        setPreview(r.data.image);
      })
      .catch(() => alert("Failed to load plant"));
  }, [id]);

  // 📸 Handle file upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, image: file });
    setPreview(URL.createObjectURL(file));
  };

  // 💾 Submit changes
  const submit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    try {
      await API.put(`/plants/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Plant updated successfully!");
      navigate("/plants/manage", { state: { updated: true } });
    } catch (err) {
      alert("❌ Update failed: " + (err?.response?.data?.error || err.message));
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header bg-success text-white">
          <h4 className="mb-0">Edit Plant</h4>
        </div>
        <div className="card-body">
          <form onSubmit={submit}>
            <div className="row g-3">
              <div className="col-md-6">
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

              <div className="col-md-6">
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

              <div className="col-md-6">
                <label className="form-label">Price (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                />
              </div>

              <div className="col-md-6">
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

              <div className="col-md-6">
                <label className="form-label">Size</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                />
              </div>

              <div className="col-md-6">
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

              <div className="col-md-12">
                <label className="form-label">Image</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    className="mt-3"
                    style={{ width: "150px", borderRadius: "10px" }}
                  />
                )}
              </div>

              <div className="col-md-12">
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
                  <i className="bi bi-check-circle me-2"></i>Update
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}