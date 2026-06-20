import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";
import { generatePDF } from "../utils/pdfGenerator";
import CustomAlert from "./CustomAlert";

export default function CreateEstimation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [plants, setPlants] = useState([]);
  const [items, setItems] = useState([]);
  const [estimations, setEstimations] = useState([]);

  const [alertConfig, setAlertConfig] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showAlert = (message, type = "success") => {
    setAlertConfig({ show: true, message, type });
  };

  const [form, setForm] = useState({
    customerName: location.state?.customerName || "",
    customerContact: location.state?.customerContact || "",
    customerAddress: location.state?.customerAddress || "",
  });

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    API.get("/plants").then(res => {
      const fetchedPlants = res.data;
      setPlants(fetchedPlants);

      // Pre-populate if navigation state exists
      if (location.state && location.state.items) {
        const mappedItems = location.state.items.map((item) => {
          let matchedId = item.plantId;
          // Attempt to resolve plantId by name if missing
          if (!matchedId && fetchedPlants) {
            const matchedPlant = fetchedPlants.find(
              (p) => p.plantName.toLowerCase() === item.plantName.toLowerCase()
            );
            if (matchedPlant) {
              matchedId = matchedPlant.id || matchedPlant._id;
            }
          }
          return {
            ...item,
            plantId: matchedId || "",
            selected: true, // Close dropdown
          };
        });
        setItems(mappedItems);
      }
    });
    loadEstimations();
  }, [location.state]);

  const loadEstimations = async () => {
    const res = await API.get("/estimations");
    setEstimations(res.data);
  };

  /* ================= ITEMS ================= */
  const addItem = () => {
    setItems([
      ...items,
      {
        plantId: "",
        plantName: "",
        rate: 0,
        quantity: 1,
        total: 0,
        search: "",
        selected: false,
      },
    ]);
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const selectPlant = (idx, plant) => {
    const next = [...items];
    next[idx] = {
      ...next[idx],
      plantId: plant.id || plant._id,
      plantName: plant.plantName,
      rate: plant.price,
      quantity: 1,
      total: plant.price,
      search: plant.plantName,
      selected: true, // close dropdown
    };
    setItems(next);
  };

  const onQtyChange = (idx, qty) => {
    const next = [...items];
    next[idx].quantity = Number(qty);
    next[idx].total = next[idx].rate * next[idx].quantity;
    setItems(next);
  };

  const subTotal = items.reduce((s, i) => s + i.total, 0);
  const totalPlants = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
  /* ================= SUBMIT ================= */
  const submit = async (e) => {
    e.preventDefault();
    if (!items.length) return showAlert("Add at least one plant", "danger");

    try {
      const res = await API.post("/estimations", {
        estimateNo: `EST-${Date.now()}`,
        ...form,
        items,
        grandTotal: subTotal,
      });

      // Generate PDF on Frontend (Merge with current items as backend only returns the main record)
      generatePDF("estimate", res.data.estimation, items);

      showAlert("Estimation created successfully!", "success");
      setForm({ customerName: "", customerContact: "", customerAddress: "" });
      setItems([]);
      loadEstimations();
    } catch (err) {
      console.error("❌ Submission failed:", err);
      showAlert("Failed to create estimation", "danger");
    }
  };

  const convertToOrder = (estimation) => {
    navigate("/orders/create", {
      state: {
        customerName: estimation.customerName,
        customerContact: estimation.customerContact,
        customerAddress: estimation.customerAddress,
        items: estimation.items.map((item) => ({
          plantId: item.plantId || null,
          plantName: item.plantName,
          rate: item.rate,
          quantity: item.quantity,
          total: item.total,
          search: item.plantName,
          showDropdown: false,
        })),
      },
    });
  };

  const createOrderFromActiveForm = () => {
    navigate("/orders/create", {
      state: {
        customerName: form.customerName,
        customerContact: form.customerContact,
        customerAddress: form.customerAddress,
        items: items.map((item) => ({
          plantId: item.plantId || null,
          plantName: item.plantName,
          rate: item.rate,
          quantity: item.quantity,
          total: item.total,
          search: item.plantName,
          showDropdown: false,
        })),
      },
    });
  };

  return (
    <div className="container mt-4">

      {/* ================= CREATE ================= */}
      <h3 className="text-success mb-3">Create Estimation</h3>

      <form onSubmit={submit} className="card p-4 shadow-sm mb-5">

        {/* CUSTOMER */}
        <div className="row mb-3">
          <div className="col-md-4">
            <input className="form-control" placeholder="Customer Name"
              value={form.customerName}
              onChange={e => setForm({ ...form, customerName: e.target.value })}
              required />
          </div>
          <div className="col-md-4">
            <input className="form-control" placeholder="Mobile"
              value={form.customerContact}
              onChange={e => setForm({ ...form, customerContact: e.target.value })} />
          </div>
          <div className="col-md-4">
            <input className="form-control" placeholder="Address"
              value={form.customerAddress}
              onChange={e => setForm({ ...form, customerAddress: e.target.value })}
              required />
          </div>
        </div>

        {/* ITEMS */}
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-2">
            <h5>Estimation Items</h5>
            <button type="button" className="btn btn-primary" onClick={addItem}>
              + Add Plant
            </button>
          </div>

          {/* DESKTOP HEADERS */}
          {items.length > 0 && (
            <div className="row fw-bold text-muted border-bottom pb-2 mb-2 d-none d-md-flex">
              <div className="col-md-4">Plant</div>
              <div className="col-md-2">Price</div>
              <div className="col-md-2">Quantity</div>
              <div className="col-md-2">Total</div>
              <div className="col-md-2">Action</div>
            </div>
          )}

          {items.map((it, idx) => {
            const filteredPlants = plants.filter(p =>
              p.plantName.toLowerCase().includes(it.search.toLowerCase())
            );

            return (
              <div key={idx} className="border rounded p-2 mb-3">
                <div className="row g-2 align-items-center">

                  {/* PLANT */}
                  <div className="col-md-4 position-relative">
                    <div className="d-md-none fw-bold mb-1">Plant</div>
                    <input
                      className="form-control"
                      placeholder="Search plant..."
                      value={it.search}
                      onChange={(e) => {
                        const next = [...items];
                        next[idx].search = e.target.value;
                        next[idx].selected = false;
                        setItems(next);
                      }}
                    />

                    {!it.selected && it.search && (
                      <div className="list-group position-absolute w-100 shadow z-3">
                        {filteredPlants.slice(0, 6).map((p) => (
                          <button
                            type="button"
                            key={p.id}
                            className="list-group-item list-group-item-action"
                            onClick={() => selectPlant(idx, p)}
                          >
                            {p.plantName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PRICE */}
                  <div className="col-md-2">
                    <div className="d-md-none fw-bold mb-1">Price</div>
                    <input className="form-control" readOnly value={`₹ ${it.rate}`} />
                  </div>

                  {/* QTY */}
                  <div className="col-md-2">
                    <div className="d-md-none fw-bold mb-1">Quantity</div>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => onQtyChange(idx, e.target.value)}
                    />
                  </div>

                  {/* TOTAL */}
                  <div className="col-md-2">
                    <div className="d-md-none fw-bold mb-1">Total</div>
                    <input className="form-control" readOnly value={`₹ ${it.total}`} />
                  </div>

                  {/* REMOVE */}
                  <div className="col-md-2">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm w-100"
                      onClick={() => removeItem(idx)}
                    >
                      ✕ Remove
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* TOTAL */}
        <div className="text-end border-top pt-3">
          <div className="mb-1"><strong>Total Plants:</strong> {totalPlants}</div>
          <div><strong>Estimated Cost: ₹ {subTotal.toFixed(2)}</strong></div>
        </div>

        <div className="d-flex gap-3 mt-3">
          <button type="submit" className="btn btn-success" disabled={!items.length}>
            Create Estimation
          </button>
          <button type="button" className="btn btn-outline-success" disabled={!items.length} onClick={createOrderFromActiveForm}>
            Create Order
          </button>
        </div>
      </form>

      {/* ================= DASHBOARD ================= */}
      <h4 className="text-success mb-3">Estimations</h4>

      <div className="card shadow-sm table-responsive">
        <table className="table table-bordered">
          <thead className="table-success">
            <tr>
              <th>Sl.No</th>
              <th>Customer</th>
              <th>Mobile</th>
              <th>Address</th>
              <th>Items</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {estimations.map((e, i) => (
              <tr key={e.id}>
                <td>{i + 1}</td>
                <td>{e.customerName}</td>
                <td>{e.customerContact || "-"}</td>
                <td>{e.customerAddress}</td>
                <td>
                  {e.items.map((it, idx) => (
                    <div key={idx}>{it.plantName} × {it.quantity}</div>
                  ))}
                </td>
                <td>{new Date(e.createdAt).toLocaleDateString("en-IN")}</td>
                <td>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => generatePDF("estimate", e, e.items)}
                      title="Download PDF"
                    >
                      <i className="bi bi-filetype-pdf"></i> PDF
                    </button>
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => convertToOrder(e)}
                      title="Convert to Order"
                    >
                      <i className="bi bi-cart-plus"></i> Create Order
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!estimations.length && (
              <tr>
                <td colSpan="7" className="text-center text-muted">
                  No estimations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {alertConfig.show && (
        <CustomAlert
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => setAlertConfig({ ...alertConfig, show: false })}
        />
      )}
    </div>
  );
}
