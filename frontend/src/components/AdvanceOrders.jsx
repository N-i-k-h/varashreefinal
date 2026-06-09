import React, { useEffect, useState } from "react";
import API from "../api";
import { generatePDF } from "../utils/pdfGenerator";

export default function AdvanceOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [payAmount, setPayAmount] = useState(0);

    // Fetch orders with a finalPaymentDate set
    const fetchAdvanceOrders = async () => {
        try {
            setLoading(true);
            const res = await API.get("/orders");
            // Filter: Must have finalPaymentDate OR start with ADV- prefix
            const advances = res.data.filter(
                (o) => (o.finalPaymentDate && o.finalPaymentDate !== null) || o.orderNo.startsWith("ADV-")
            );
            console.log("Fetched Advances:", advances); // DEBUG
            setOrders(advances);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvanceOrders();
    }, []);

    const handlePayClick = (order) => {
        setEditingId(order.id);
        setPayAmount(order.balanceAmount); // suggest full balance
    };

    const handleCancel = () => {
        setEditingId(null);
        setPayAmount(0);
    };


    const handleUpdatePayment = async (order) => {
        const amount = Number(payAmount);
        if (amount <= 0 || amount > order.balanceAmount) {
            return alert("Invalid payment amount");
        }

        try {
            // New Paid Amount = Old Paid + Current Payment
            const newPaidTotal = order.paidAmount + amount;

            await API.put(`/orders/${order.id}/pay`, { paidAmount: newPaidTotal });
            alert("Payment updated successfully! Downloading updated invoice...");

            // ✅ Always download invoice after payment update
            generatePDF("order", order, order.orderItems);

            setEditingId(null);
            fetchAdvanceOrders();
        } catch (err) {
            console.error(err);
            alert("Failed to update payment");
        }
    };

    if (loading)
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary"></div>
            </div>
        );

    return (
        <div className="container mt-4">
            <h2 className="text-primary mb-4">Advance Orders Management</h2>
            <p className="text-muted">Tracking orders with scheduled final payments.</p>

            {orders.length === 0 ? (
                <div className="alert alert-info">No advance orders found.</div>
            ) : (
                <div className="table-responsive bg-white rounded shadow-sm p-3">
                    <table className="table table-hover align-middle">
                        <thead className="table-primary">
                            <tr>
                                <th>Order Info</th>
                                <th>Customer</th>
                                <th>Employee</th>
                                <th>Plants (Stock)</th>
                                <th>Total Payment</th>
                                <th>Advance Paid</th>
                                <th>Left Due</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((o) => {
                                const isEditing = editingId === o.id;
                                const isOverdue = o.finalPaymentDate && new Date(o.finalPaymentDate) < new Date() && o.balanceAmount > 0;

                                return (
                                    <tr key={o.id} className={isOverdue ? "table-danger" : ""}>
                                        {/* Order Info */}
                                        <td>
                                            <div className="fw-bold">{o.orderNo}</div>
                                            <small className="text-muted">
                                                Due: {o.finalPaymentDate ? new Date(o.finalPaymentDate).toLocaleDateString("en-IN") : <span className="text-danger">Not Set</span>}
                                            </small>
                                            {isOverdue && <div className="badge bg-danger mt-1">Overdue</div>}
                                        </td>

                                        {/* Customer */}
                                        <td>
                                            <div>{o.customerName}</div>
                                            <small className="text-muted">{o.customerContact}</small>
                                        </td>

                                        {/* Employee */}
                                        <td className="text-muted small">
                                            {o.employeeName || "-"}
                                        </td>

                                        {/* Plants */}
                                        <td>
                                            {o.orderItems && o.orderItems.length > 0 ? (
                                                <ul className="list-unstyled mb-0 small" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                                                    {o.orderItems.map((item, idx) => (
                                                        <li key={idx} className="mb-1">
                                                            <span className="badge bg-light text-dark border">
                                                                {item.plantName}
                                                            </span>
                                                            <span className="ms-1 text-muted">x{item.quantity}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : "-"}
                                        </td>

                                        {/* Total Payment/Grand Total */}
                                        <td className="fw-bold">
                                            ₹ {Number(o.grandTotal || 0).toFixed(2)}
                                        </td>

                                        {/* Advance/Paid Amount */}
                                        <td className="text-success fw-bold">
                                            ₹ {Number(o.paidAmount || 0).toFixed(2)}
                                        </td>

                                        {/* Left Due/Balance Amount */}
                                        <td className="text-danger fw-bold">
                                            ₹ {Number(o.balanceAmount || 0).toFixed(2)}
                                        </td>

                                        {/* Status */}
                                        <td>
                                            <span className={`badge ${o.balanceAmount <= 0 ? "bg-success" : "bg-warning text-dark"}`}>
                                                {o.balanceAmount <= 0 ? "Fully Paid" : "Pending"}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td>
                                            {o.balanceAmount > 0 && (
                                                <>
                                                    {isEditing ? (
                                                        <div className="d-flex flex-column gap-2">
                                                            <input
                                                                type="number"
                                                                className="form-control form-control-sm"
                                                                placeholder="Amount"
                                                                value={payAmount}
                                                                onChange={(e) => setPayAmount(e.target.value)}
                                                            />
                                                            <div className="btn-group btn-group-sm">
                                                                <button className="btn btn-success" onClick={() => handleUpdatePayment(o)}>
                                                                    Pay
                                                                </button>
                                                                <button className="btn btn-secondary" onClick={handleCancel}>
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="btn btn-sm btn-outline-primary w-100"
                                                            onClick={() => handlePayClick(o)}
                                                        >
                                                            Update Pay
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {o.balanceAmount <= 0 && <span className="text-success me-2"><i className="bi bi-check-circle-fill"></i> Done</span>}

                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                title="Download Invoice"
                                                onClick={() => generatePDF("order", o, o.orderItems)}
                                            >
                                                <i className="bi bi-download"></i>
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
