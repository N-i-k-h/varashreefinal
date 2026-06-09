import React, { useState } from "react";
import API from "../api";

export default function AddPlant() {
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showAlert = (message, type = "success") => {
    setAlertConfig({ show: true, message, type });
    // Auto-dismiss alert after 3 seconds
    setTimeout(() => {
      setAlertConfig(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    try {
      await API.post("/plants", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showAlert("✅ Plant added successfully!", "success");
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
      // Clear file input manually
      const fileInput = document.getElementById("plant-image-input");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      showAlert("❌ Error: " + (err?.response?.data?.error || err.message), "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      {/* Alert display using custom/bootstrap styling */}
      {alertConfig.show && (
        <div className={`alert alert-${alertConfig.type} shadow-sm mb-4`} role="alert">
          {alertConfig.message}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-success m-0">Add Plant</h2>
      </div>

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
                <label className="form-label">Price (₹) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.price || ""}
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
                  value={form.stock || ""}
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

              {/* Image upload */}
              <div className="col-12">
                <label className="form-label">Upload Image</label>
                <input
                  id="plant-image-input"
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
                <button type="submit" className="btn btn-success px-4" disabled={isSubmitting}>
                  <i className="bi bi-check-circle me-2"></i>
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
