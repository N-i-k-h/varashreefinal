import React, { useEffect, useState } from "react";
import API from "../api";
import { generatePDF } from "../utils/pdfGenerator";
import CustomAlert from "./CustomAlert";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function BillManagement() {
  const [orders, setOrders] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editPaidAmount, setEditPaidAmount] = useState(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState("Cash");
  const [editStatus, setEditStatus] = useState("Paid");
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerContact: "",
    customerAddress: "",
    employeeName: "",
    createdAt: "",
    finalPaymentDate: "",
  });

  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [deletingOrderNo, setDeletingOrderNo] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showAlert = (message, type = "success") => {
    setAlertConfig({ show: true, message, type });
  };

  const fetchOrdersAndPlants = async () => {
    try {
      setLoading(true);
      const [ordersRes, plantsRes] = await Promise.all([
        API.get("/orders"),
        API.get("/plants"),
      ]);
      setOrders(ordersRes.data);
      setPlants(plantsRes.data);
    } catch (err) {
      console.error("❌ Failed to fetch data:", err);
      showAlert("Failed to load orders or plants", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndPlants();
  }, []);

  // Opens the delete confirmation modal
  const handleCancelOrder = (id, orderNo) => {
    if (!id) {
      showAlert("Error: Order ID is missing!", "danger");
      return;
    }
    setDeletingOrderId(id);
    setDeletingOrderNo(orderNo || "");
    setShowDeleteModal(true);
  };

  // Executes the actual cancellation after user confirms
  const confirmCancelOrder = async () => {
    if (!deletingOrderId) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/orders/${deletingOrderId}`);
      showAlert(`Bill ${deletingOrderNo} cancelled successfully and stock refilled!`, "success");
      setShowDeleteModal(false);
      setDeletingOrderId(null);
      setDeletingOrderNo("");
      fetchOrdersAndPlants();
    } catch (err) {
      console.error("Cancel order error:", err);
      const errMsg = err.response?.data?.error || "Failed to cancel bill";
      showAlert("Error: " + errMsg, "danger");
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (order) => {
    setEditingOrder(order);
    setEditItems(
      order.orderItems.map((it) => ({
        plantId: it.plantId,
        plantName: it.plantName,
        rate: it.rate,
        quantity: it.quantity,
        total: it.total,
        search: it.plantName,
        showDropdown: false,
      }))
    );
    setEditDiscount(order.discount || 0);
    setEditPaidAmount(order.paidAmount || 0);
    setEditPaymentMethod(order.paymentMethod || "Cash");
    setEditStatus(order.status || "Paid");

    // Format date string for input type="date"
    const dateObj = new Date(order.createdAt);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    let payDate = "";
    if (order.finalPaymentDate) {
      const pDate = new Date(order.finalPaymentDate);
      payDate = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, "0")}-${String(pDate.getDate()).padStart(2, "0")}`;
    }

    setEditForm({
      customerName: order.customerName || "",
      customerContact: order.customerContact || "",
      customerAddress: order.customerAddress || "",
      employeeName: order.employeeName || "",
      createdAt: formattedDate,
      finalPaymentDate: payDate,
    });
    setShowEditModal(true);
  };

  // Edit Modal Operations
  const addEditItem = () => {
    setEditItems([
      ...editItems,
      {
        plantId: "",
        plantName: "",
        rate: 0,
        quantity: 1,
        total: 0,
        search: "",
        showDropdown: false,
      },
    ]);
  };

  const removeEditItem = (idx) => {
    setEditItems(editItems.filter((_, i) => i !== idx));
  };

  const onEditPlantSelect = (idx, plant) => {
    const next = [...editItems];
    next[idx] = {
      ...next[idx],
      plantId: plant.id || plant._id,
      plantName: plant.plantName,
      rate: plant.price,
      quantity: 1,
      total: plant.price,
      search: plant.plantName,
      showDropdown: false,
    };
    setEditItems(next);
  };

  const onEditQtyChange = (idx, qty) => {
    const next = [...editItems];
    next[idx].quantity = Number(qty);
    next[idx].total = next[idx].rate * next[idx].quantity;
    setEditItems(next);
  };

  // Modal Math
  const editSubTotal = editItems.reduce((sum, i) => sum + i.total, 0);
  const editGrandTotal = editSubTotal - Number(editDiscount || 0);
  const editBalanceAmount = editGrandTotal - Number(editPaidAmount || 0);

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editItems.length) return showAlert("Add at least one plant to the bill", "danger");
    if (editItems.some((i) => !i.plantId))
      return showAlert("Select plant for all rows", "danger");

    const payload = {
      customerName: editForm.customerName,
      customerContact: editForm.customerContact,
      customerAddress: editForm.customerAddress,
      employeeName: editForm.employeeName,
      createdAt: new Date(editForm.createdAt),
      items: editItems.map((it) => ({
        plantId: it.plantId,
        plantName: it.plantName,
        rate: it.rate,
        quantity: it.quantity,
        total: it.total,
      })),
      subTotal: editSubTotal,
      discount: Number(editDiscount),
      grandTotal: editGrandTotal,
      paidAmount: Number(editPaidAmount),
      paymentMethod: editPaymentMethod,
      status: editStatus,
      finalPaymentDate: editBalanceAmount > 0 ? editForm.finalPaymentDate : null,
    };

    try {
      const orderId = editingOrder._id || editingOrder.id;
      await API.put(`/orders/${orderId}`, payload);
      alert("Bill updated successfully!");
      showAlert("Bill updated successfully!", "success");
      setShowEditModal(false);
      fetchOrdersAndPlants();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || "Failed to update bill";
      alert("Error: " + errMsg);
      showAlert(errMsg, "danger");
    }
  };

  // Filter and Search Logic
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerContact && o.customerContact.includes(searchQuery));

    const matchesStatus = statusFilter === "All" || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="spinner-border text-success" style={{ width: "3rem", height: "3rem" }} />
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 px-sm-4 mt-4">
      <h2 className="text-success mb-4 fw-bold">
        <i className="bi bi-receipt-cutoff me-2"></i> Bill Management
      </h2>

      {/* SEARCH AND FILTER BAR */}
      <div className="card shadow-sm border-0 mb-4 bg-white">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold text-secondary">Search Bills</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-light"
                  placeholder="Search by Order No, Customer, Contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold text-secondary">Filter by Status</label>
              <select
                className="form-select bg-light"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* BILLS LIST */}
      {filteredOrders.length === 0 ? (
        <div className="alert alert-info shadow-sm">
          <i className="bi bi-info-circle-fill me-2"></i> No bills found matching criteria.
        </div>
      ) : (
        <>
          {/* ===== DESKTOP TABLE (hidden on small screens) ===== */}
          <div className="card shadow-sm border-0 d-none d-md-block">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 table-sm compact-table" style={{ fontSize: "0.8rem" }}>
                  <thead className="table-success">
                    <tr>
                      <th className="py-2 ps-3 pe-5 text-nowrap">Bill No</th>
                      <th className="py-2 text-nowrap">Customer</th>
                      <th className="py-2 text-nowrap d-none d-lg-table-cell">Attended By</th>
                      <th className="py-2 text-nowrap">Date</th>
                      <th className="py-2 text-nowrap">Grand Total</th>
                      <th className="py-2 text-nowrap">Paid</th>
                      <th className="py-2 text-nowrap">Balance</th>
                      <th className="py-2 text-center text-nowrap">Status</th>
                      <th className="py-2 text-center text-nowrap pe-3" style={{ width: "110px", minWidth: "110px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => {
                      const isCancelled = o.status === "Cancelled";
                      const orderId = o._id || o.id;
                      return (
                        <tr key={orderId} className={isCancelled ? "table-danger text-muted" : ""}>
                          <td className="ps-3 pe-5 fw-bold text-nowrap">{o.orderNo}</td>
                          <td className="fw-semibold text-nowrap">{o.customerName}</td>
                          <td className="text-nowrap d-none d-lg-table-cell">{o.employeeName || "-"}</td>
                          <td className="text-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td className={`fw-bold text-nowrap ${isCancelled ? "text-decoration-line-through text-muted" : "text-dark"}`}>
                            ₹{o.grandTotal.toFixed(0)}
                          </td>
                          <td className={`fw-bold text-nowrap ${isCancelled ? "text-decoration-line-through text-muted" : "text-success"}`}>
                            ₹{o.paidAmount.toFixed(0)}
                          </td>
                          <td className={`fw-bold text-nowrap ${isCancelled ? "text-decoration-line-through text-muted" : "text-danger"}`}>
                            ₹{o.balanceAmount.toFixed(0)}
                          </td>
                          <td className="text-center text-nowrap">
                            <span
                              className={`badge px-2 py-1 rounded-pill ${
                                o.status === "Paid"
                                  ? "bg-success"
                                  : o.status === "Cancelled"
                                  ? "bg-danger text-white"
                                  : "bg-warning text-dark"
                              }`}
                              style={{ fontSize: "0.72rem" }}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="text-center pe-3" style={{ width: "110px", minWidth: "110px" }}>
                            <div className="d-flex gap-1 justify-content-center">
                              <button
                                className="btn btn-xs btn-outline-primary px-1 py-0.5"
                                title="Download Invoice"
                                onClick={() => generatePDF("order", o, o.orderItems)}
                              >
                                <i className="bi bi-download" style={{ fontSize: "0.75rem" }}></i>
                              </button>

                              <button
                                className="btn btn-xs btn-outline-secondary px-1 py-0.5"
                                title="Edit Bill"
                                onClick={() => handleOpenEdit(o)}
                              >
                                <i className="bi bi-pencil-square" style={{ fontSize: "0.75rem" }}></i>
                              </button>

                              {!isCancelled && (
                                <button
                                  className="btn btn-xs btn-outline-danger px-1 py-0.5"
                                  title="Cancel Bill"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelOrder(orderId, o.orderNo);
                                  }}
                                >
                                  <i className="bi bi-trash" style={{ fontSize: "0.75rem" }}></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ===== MOBILE CARDS (visible only on small screens) ===== */}
          <div className="d-md-none">
            {filteredOrders.map((o) => {
              const isCancelled = o.status === "Cancelled";
              const orderId = o._id || o.id;
              return (
                <div
                  key={orderId}
                  className={`card shadow-sm border-0 mb-3 ${isCancelled ? "border-start border-danger border-3" : "border-start border-success border-3"}`}
                  style={{ borderLeft: isCancelled ? "4px solid #dc3545" : "4px solid #198754" }}
                >
                  <div className="card-body p-3">
                    {/* Header Row: Bill No + Status */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>{o.orderNo}</span>
                      <span
                        className={`badge px-2 py-1 rounded-pill ${
                          o.status === "Paid" ? "bg-success" : o.status === "Cancelled" ? "bg-danger" : "bg-warning text-dark"
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>

                    {/* Customer & Date */}
                    <div className="mb-2">
                      <div className="fw-semibold text-dark">{o.customerName}</div>
                      <small className="text-muted">
                        <i className="bi bi-calendar3 me-1"></i>{new Date(o.createdAt).toLocaleDateString()}
                        {o.employeeName && <span className="ms-2"><i className="bi bi-person me-1"></i>{o.employeeName}</span>}
                      </small>
                    </div>

                    {/* Amount Row */}
                    <div className="row g-1 mb-2">
                      <div className="col-4 text-center">
                        <small className="text-muted d-block">Total</small>
                        <span className={`fw-bold ${isCancelled ? "text-decoration-line-through text-muted" : "text-dark"}`} style={{ fontSize: "0.9rem" }}>
                          ₹{o.grandTotal.toFixed(0)}
                        </span>
                      </div>
                      <div className="col-4 text-center">
                        <small className="text-muted d-block">Paid</small>
                        <span className={`fw-bold ${isCancelled ? "text-decoration-line-through text-muted" : "text-success"}`} style={{ fontSize: "0.9rem" }}>
                          ₹{o.paidAmount.toFixed(0)}
                        </span>
                      </div>
                      <div className="col-4 text-center">
                        <small className="text-muted d-block">Balance</small>
                        <span className={`fw-bold ${isCancelled ? "text-decoration-line-through text-muted" : "text-danger"}`} style={{ fontSize: "0.9rem" }}>
                          ₹{o.balanceAmount.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2 pt-2 border-top">
                      <button
                        className="btn btn-sm btn-outline-primary flex-fill"
                        onClick={() => generatePDF("order", o, o.orderItems)}
                      >
                        <i className="bi bi-download me-1"></i> Invoice
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary flex-fill"
                        onClick={() => handleOpenEdit(o)}
                      >
                        <i className="bi bi-pencil-square me-1"></i> Edit
                      </button>
                      {!isCancelled && (
                        <button
                          className="btn btn-sm btn-outline-danger flex-fill"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelOrder(orderId, o.orderNo);
                          }}
                        >
                          <i className="bi bi-trash me-1"></i> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", overflowY: "auto" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
            <form onSubmit={handleSaveEdit} className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square me-2"></i> Edit Bill: {editingOrder?.orderNo}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
                <div className="modal-body p-4">
                  {/* Customer Information */}
                  <h6 className="fw-bold text-success border-bottom pb-2 mb-3">Customer Information</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Customer Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={editForm.customerName}
                        onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Contact</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.customerContact}
                        onChange={(e) => setEditForm({ ...editForm, customerContact: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Address *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={editForm.customerAddress}
                        onChange={(e) => setEditForm({ ...editForm, customerAddress: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Attended By</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.employeeName}
                        onChange={(e) => setEditForm({ ...editForm, employeeName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Bill Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={editForm.createdAt}
                        onChange={(e) => setEditForm({ ...editForm, createdAt: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Bill Items */}
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <h6 className="fw-bold text-success mb-0">Bill Items</h6>
                    <button type="button" className="btn btn-sm btn-primary" onClick={addEditItem}>
                      <i className="bi bi-plus-lg me-1"></i> Add Plant
                    </button>
                  </div>

                  {/* DESKTOP HEADER ONLY */}
                  {editItems.length > 0 && (
                    <div className="row g-2 fw-bold text-muted border-bottom pb-2 mb-2 d-none d-md-flex">
                      <div className="col-md-5">Plant</div>
                      <div className="col-md-2">Rate</div>
                      <div className="col-md-2">Quantity</div>
                      <div className="col-md-2">Total</div>
                      <div className="col-md-1 text-end">Action</div>
                    </div>
                  )}

                  <div className="mb-4">
                    {editItems.map((it, idx) => {
                      const filteredPlants = plants.filter((p) =>
                        p.plantName.toLowerCase().includes(it.search.toLowerCase())
                      );

                      return (
                        <div key={idx} className="border rounded p-3 mb-2 bg-light">
                          <div className="row g-2 align-items-center">
                            <div className="col-12 col-md-5 position-relative mb-2 mb-md-0">
                              <label className="small fw-semibold d-md-none">Plant</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Search plant..."
                                value={it.search}
                                onChange={(e) => {
                                  const next = [...editItems];
                                  next[idx].search = e.target.value;
                                  next[idx].showDropdown = true;
                                  setEditItems(next);
                                }}
                              />
                              {it.showDropdown && filteredPlants.length > 0 && (
                                <div className="list-group position-absolute w-100 shadow z-3" style={{ maxHeight: "200px", overflowY: "auto" }}>
                                  {filteredPlants.slice(0, 6).map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      className="list-group-item list-group-item-action py-1 px-2 small"
                                      onClick={() => onEditPlantSelect(idx, p)}
                                    >
                                      {p.plantName} (Stock: {p.stock})
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="col-3 col-md-2">
                              <label className="small fw-semibold d-md-none">Rate</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                readOnly
                                value={it.rate ? `₹${it.rate.toFixed(0)}` : ""}
                              />
                            </div>

                            <div className="col-3 col-md-2">
                              <label className="small fw-semibold d-md-none">Qty</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => onEditQtyChange(idx, e.target.value)}
                              />
                            </div>

                            <div className="col-3 col-md-2">
                              <label className="small fw-semibold d-md-none">Total</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                readOnly
                                value={it.total ? `₹${it.total.toFixed(0)}` : ""}
                              />
                            </div>

                            <div className="col-3 col-md-1 text-end">
                              <label className="small fw-semibold d-md-none">&nbsp;</label>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger w-100"
                                onClick={() => removeEditItem(idx)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment Details */}
                  <h6 className="fw-bold text-success border-bottom pb-2 mb-3">Payment details</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Payment Method</label>
                        <select
                          className="form-select"
                          value={editPaymentMethod}
                          onChange={(e) => setEditPaymentMethod(e.target.value)}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Online">Online</option>
                          <option value="Card">Card</option>
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">Bill Status</label>
                        <select
                          className="form-select"
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      {editBalanceAmount > 0 && editStatus !== "Cancelled" && (
                        <div className="mb-3">
                          <label className="form-label fw-semibold text-danger">Final Payment Date *</label>
                          <input
                            type="date"
                            className="form-control"
                            required
                            value={editForm.finalPaymentDate}
                            onChange={(e) => setEditForm({ ...editForm, finalPaymentDate: e.target.value })}
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-md-6 bg-light p-3 rounded">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-secondary fw-semibold">Subtotal:</span>
                        <span className="fw-bold">₹{editSubTotal.toFixed(2)}</span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-secondary fw-semibold">Discount:</span>
                        <input
                          type="number"
                          className="form-control form-control-sm text-end"
                          style={{ width: "120px" }}
                          min="0"
                          value={editDiscount}
                          onChange={(e) => setEditDiscount(Number(e.target.value))}
                        />
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-3 border-top pt-2">
                        <span className="fw-bold text-dark">Grand Total:</span>
                        <span className="fw-bold fs-5 text-dark">₹{editGrandTotal.toFixed(2)}</span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-secondary fw-semibold">Paid Amount:</span>
                        <input
                          type="number"
                          className="form-control form-control-sm text-end"
                          style={{ width: "120px" }}
                          min="0"
                          value={editPaidAmount}
                          onChange={(e) => setEditPaidAmount(Number(e.target.value))}
                        />
                      </div>

                      <div className="d-flex justify-content-between align-items-center border-top pt-2 text-danger">
                        <span className="fw-bold">Balance Due:</span>
                        <span className="fw-bold fs-5">₹{Math.max(0, editBalanceAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Save Changes
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i> Confirm Cancellation
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => { setShowDeleteModal(false); setDeletingOrderId(null); }}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="text-center mb-3">
                  <i className="bi bi-trash3 text-danger" style={{ fontSize: "3rem" }}></i>
                </div>
                <p className="text-center fs-5 mb-2">
                  Are you sure you want to <strong className="text-danger">cancel</strong> this bill?
                </p>
                {deletingOrderNo && (
                  <p className="text-center text-muted mb-3">
                    Bill No: <strong>{deletingOrderNo}</strong>
                  </p>
                )}
                <div className="alert alert-warning py-2 mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  This will restore the stock of all items in this bill. This action cannot be undone.
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={deleteLoading}
                  onClick={() => { setShowDeleteModal(false); setDeletingOrderId(null); }}
                >
                  <i className="bi bi-x-lg me-1"></i> No, Keep Bill
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={deleteLoading}
                  onClick={confirmCancelOrder}
                >
                  {deleteLoading ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span> Cancelling...</>
                  ) : (
                    <><i className="bi bi-trash me-1"></i> Yes, Cancel Bill</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALERT */}
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
