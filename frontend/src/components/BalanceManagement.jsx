import React, { useEffect, useState } from "react";
import API from "../api";
import { generatePDF } from "../utils/pdfGenerator";

export default function BalanceManagement() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editAmount, setEditAmount] = useState(0);

    // Fetch only orders with outstanding balance
    const fetchBalances = async () => {
        try {
            setLoading(true);
            const res = await API.get("/orders");
            // Filter locally for simplicity (or can add query param to API)
            // Filter: Balance > 0 AND NOT an Advance Order (starts with ADV-)
            const pending = res.data.filter(
                (o) => o.balanceAmount > 0 && !o.orderNo.startsWith("ADV-")
            );
            setOrders(pending);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalances();
    }, []);

    const handleEdit = (order) => {
        setEditingId(order.id);
        setEditAmount(0); // Start with 0 for incremental payment
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditAmount(0);
    };

    const handleUpdate = async (order) => {
        const payment = Number(editAmount);

        if (payment <= 0) return alert("Please enter a valid amount to pay");
        if (payment > order.balanceAmount) return alert("Payment amount cannot exceed proper balance");

        const newPaidTotal = order.paidAmount + payment;

        try {
            await API.put(`/orders/${order.id}/pay`, { paidAmount: newPaidTotal });

            // If fully paid, download invoice
            if (newPaidTotal >= order.grandTotal) {
                generatePDF("order", order, order.orderItems);
            }

            setEditingId(null);
            fetchBalances(); // Refresh list
        } catch (err) {
            alert("Failed to update payment");
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-success"></div></div>;

    return (

        <div className="container-fluid px-2 px-md-4 mt-4">
            <h2 className="text-success mb-4 fw-bold">Balance Management</h2>

            {orders.length === 0 ? (
                <div className="alert alert-success shadow-sm">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    No outstanding balances!
                </div>
            ) : (
                <div className="card shadow-sm border-0">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-success">
                                    <tr>
                                        <th className="py-3 ps-3">Order No</th>
                                        <th className="py-3">Customer</th>
                                        <th className="py-3">Contact</th>
                                        <th className="py-3">Total</th>
                                        <th className="py-3">Paid</th>
                                        <th className="py-3">Balance</th>
                                        <th className="py-3 pe-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((o) => (
                                        <tr key={o.id}>
                                            <td className="ps-3 fw-medium">{o.orderNo}</td>
                                            <td>{o.customerName}</td>
                                            <td>{o.customerContact || "-"}</td>
                                            <td className="fw-bold">₹{o.grandTotal.toFixed(2)}</td>

                                            {/* EDIT MODE */}
                                            {editingId === o.id ? (
                                                <>
                                                    <td style={{ minWidth: "120px" }}>
                                                        <input
                                                            type="number"
                                                            className="form-control form-control-sm"
                                                            placeholder="Amount"
                                                            value={editAmount}
                                                            onChange={(e) => setEditAmount(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </td>
                                                    <td className="text-success fw-bold">
                                                        {/* Preview New Balance */}
                                                        ₹{(o.balanceAmount - Number(editAmount)).toFixed(2)}
                                                    </td>
                                                    <td className="pe-3">
                                                        <div className="d-flex gap-2">
                                                            <button className="btn btn-sm btn-success" onClick={() => handleUpdate(o)}>
                                                                <i className="bi bi-check-lg"></i>
                                                            </button>
                                                            <button className="btn btn-sm btn-outline-secondary" onClick={handleCancel}>
                                                                <i className="bi bi-x-lg"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                // VIEW MODE
                                                <>
                                                    <td>₹{o.paidAmount.toFixed(2)}</td>
                                                    <td className="text-danger fw-bold">₹{o.balanceAmount.toFixed(2)}</td>
                                                    <td className="pe-3">
                                                        <button className="btn btn-sm btn-primary rounded-pill px-3" onClick={() => handleEdit(o)}>
                                                            Update
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
