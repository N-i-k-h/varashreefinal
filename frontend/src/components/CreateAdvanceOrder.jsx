import React, { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { generatePDF } from "../utils/pdfGenerator";
import CustomAlert from "./CustomAlert";

export default function CreateAdvanceOrder() {
    const [plants, setPlants] = useState([]);
    const [items, setItems] = useState([]);
    const [discount, setDiscount] = useState(0);

    const [alertConfig, setAlertConfig] = useState({
        show: false,
        message: "",
        type: "success",
    });

    const getTodayDateString = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const showAlert = (message, type = "success") => {
        setAlertConfig({ show: true, message, type });
    };

    const [form, setForm] = useState({
        customerName: "",
        customerContact: "",
        customerAddress: "",
        finalPaymentDate: "", // ✅ Added for Advance Order
        employeeName: "",
        createdAt: getTodayDateString(),
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    // =============================
    // FETCH PLANTS
    // =============================
    useEffect(() => {
        API.get("/plants")
            .then((res) => setPlants(res.data))
            .catch(console.error);
    }, []);

    // =============================
    // ADD / REMOVE ITEM
    // =============================
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
                showDropdown: false,
            },
        ]);
    };

    const removeItem = (idx) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    // =============================
    // SELECT PLANT
    // =============================
    const onPlantSelect = (idx, plant) => {
        const next = [...items];
        next[idx] = {
            ...next[idx],
            plantId: plant.id,
            plantName: plant.plantName,
            rate: plant.price,
            quantity: 1,
            total: plant.price,
            search: plant.plantName,
            showDropdown: false,
        };
        setItems(next);
    };

    // =============================
    // UPDATE QUANTITY
    // =============================
    const onQtyChange = (idx, qty) => {
        const next = [...items];
        next[idx].quantity = Number(qty);
        next[idx].total = next[idx].rate * next[idx].quantity;
        setItems(next);
    };

    // =============================
    // CALCULATIONS
    // =============================
    const subTotal = items.reduce((sum, i) => sum + i.total, 0);
    const grandTotal = subTotal - Number(discount || 0);
    const totalPlants = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);

    // ✅ Paid Amount State (For Advance, default to 0 or manual)
    const [paidAmount, setPaidAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("Cash");

    const balanceAmount = grandTotal - paidAmount;

    // =============================
    // SUBMIT ORDER
    // =============================
    const submit = async (e) => {
        e.preventDefault();

        if (!items.length) return showAlert("Add at least one plant", "danger");
        if (items.some((i) => !i.plantId))
            return showAlert("Select plant for all rows", "danger");

        // Validate final payment date
        if (!form.finalPaymentDate) return showAlert("Please select a Final Payment Date", "danger");

        // Validate that it is indeed an advance order (partial payment)
        if (paidAmount >= grandTotal) {
            if (!window.confirm("You are paying the full amount. Is this intentional for an 'Advance Order'?")) return;
        }

        setIsSubmitting(true);

        const payload = {
            orderNo: `ADV-${Date.now()}`, // Distinct prefix
            customerName: form.customerName,
            customerContact: form.customerContact,
            customerAddress: form.customerAddress,
            items,
            subTotal,
            discount,
            grandTotal,
            paidAmount: Number(paidAmount),
            finalPaymentDate: form.finalPaymentDate,
            paymentMethod,
            employeeName: form.employeeName, // ✅ Send Employee Name
            createdAt: form.createdAt ? new Date(form.createdAt) : new Date(),
        };

        try {
            const res = await API.post("/orders", payload);
            showAlert("Advance Order created successfully! Invoice will be downloaded.", "success");

            // ✅ Generate Invoice on Frontend
            generatePDF("order", res.data.order, items);

            setTimeout(() => {
                navigate("/advances"); // Redirect to Advance Orders list
            }, 2500);
        } catch (err) {
            showAlert(err?.response?.data?.error || "Order failed", "danger");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="container mt-4">
            <h2 className="text-primary mb-4">Create Advance Order</h2>

            <form onSubmit={submit} className="card p-4 shadow-sm border-primary">

                {/* CUSTOMER INFO */}
                <div className="row mb-3">
                    <div className="col-md-3">
                        <label>Customer Name *</label>
                        <input
                            className="form-control"
                            required
                            value={form.customerName}
                            onChange={(e) =>
                                setForm({ ...form, customerName: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-3">
                        <label>Contact</label>
                        <input
                            className="form-control"
                            value={form.customerContact}
                            onChange={(e) =>
                                setForm({ ...form, customerContact: e.target.value })
                            }
                        />
                    </div>

                    <div className="col-md-3">
                        <label>Address *</label>
                        <input
                            className="form-control"
                            required
                            value={form.customerAddress}
                            onChange={(e) =>
                                setForm({ ...form, customerAddress: e.target.value })
                            }
                        />
                    </div>

                    {/* FINAL PAYMENT DATE */}
                    <div className="col-md-3">
                        <label className="fw-bold text-primary">Final Payment Date *</label>
                        <input
                            type="date"
                            className="form-control border-primary"
                            required
                            value={form.finalPaymentDate}
                            onChange={(e) =>
                                setForm({ ...form, finalPaymentDate: e.target.value })
                            }
                        />
                    </div>
                </div>

                {/* EMPLOYEE NAME */}


                {/* ITEMS */}
                <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                        <h5>Order Items</h5>
                        <button type="button" className="btn btn-outline-primary" onClick={addItem}>
                            + Add Plant
                        </button>
                    </div>

                    {/* DESKTOP HEADER */}
                    {items.length > 0 && (
                        <div className="row g-2 fw-bold text-muted border-bottom pb-2 mb-2 d-none d-md-flex">
                            <div className="col-md-4">Plant</div>
                            <div className="col-md-2">Price</div>
                            <div className="col-md-2">Quantity</div>
                            <div className="col-md-2">Total</div>
                            <div className="col-md-2">Action</div>
                        </div>
                    )}

                    {items.map((it, idx) => {
                        const filteredPlants = plants.filter((p) =>
                            p.plantName.toLowerCase().includes(it.search.toLowerCase())
                        );

                        return (
                            <div key={idx} className="border rounded p-3 mb-3">
                                <div className="row g-2 align-items-center">
                                    {/* PLANT */}
                                    <div className="col-md-4 position-relative">
                                        <input
                                            className="form-control"
                                            placeholder="Search plant..."
                                            value={it.search}
                                            onChange={(e) => {
                                                const next = [...items];
                                                next[idx].search = e.target.value;
                                                next[idx].showDropdown = true;
                                                setItems(next);
                                            }}
                                        />
                                        {it.showDropdown && filteredPlants.length > 0 && (
                                            <div className="list-group position-absolute w-100 shadow z-3">
                                                {filteredPlants.slice(0, 6).map((p) => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        className="list-group-item list-group-item-action"
                                                        onClick={() => onPlantSelect(idx, p)}
                                                    >
                                                        {p.plantName} (Stock: {p.stock})
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* PRICE */}
                                    <div className="col-md-2">
                                        <input
                                            className="form-control"
                                            readOnly
                                            value={it.rate ? `₹ ${it.rate.toFixed(2)}` : ""}
                                        />
                                    </div>

                                    {/* QTY */}
                                    <div className="col-md-2">
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
                                        <input
                                            className="form-control"
                                            readOnly
                                            value={it.total ? `₹ ${it.total.toFixed(2)}` : ""}
                                        />
                                    </div>

                                    {/* REMOVE */}
                                    <div className="col-md-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm w-100"
                                            onClick={() => removeItem(idx)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* METADATA INFO */}
                <div className="row mb-3">
                    <div className="col-md-3">
                        <label className="fw-bold">Employee Name (Attended By) *</label>
                        <input
                            className="form-control border-primary"
                            required
                            placeholder="Enter name..."
                            value={form.employeeName || ""}
                            onChange={(e) =>
                                setForm({ ...form, employeeName: e.target.value })
                            }
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="fw-bold">Order Date *</label>
                        <input
                            type="date"
                            className="form-control border-primary"
                            required
                            max={getTodayDateString()}
                            value={form.createdAt}
                            onChange={(e) =>
                                setForm({ ...form, createdAt: e.target.value })
                            }
                        />
                    </div>
                </div>

                <div className="border-top pt-3">
                    <div className="row">
                        <div className="col-md-4 offset-md-8">
                            <p className="mb-1"><strong>Total Plants:</strong> {totalPlants}</p>
                            <p className="mb-2"><strong>Subtotal:</strong> ₹ {subTotal.toFixed(2)}</p>

                            <div className="mb-2">
                                <label>Discount</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    min="0"
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                />
                            </div>

                            <p className="fw-bold text-success fs-5">
                                Grand Total: ₹ {grandTotal.toFixed(2)}
                            </p>

                            {/* ADVANCE PAID AMOUNT */}
                            <div className="mb-2 bg-light p-2 rounded border border-primary">
                                <label className="fw-bold text-primary">Advance Payment Amount</label>
                                <input
                                    type="number"
                                    className="form-control border-primary fw-bold"
                                    min="0"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                                />
                            </div>

                            {/* PAYMENT METHOD */}
                            <div className="mb-2 bg-light p-2 rounded border border-primary">
                                <label className="fw-bold text-primary d-block mb-2">Payment Method</label>
                                <div className="form-check form-check-inline">
                                    <input className="form-check-input" type="radio" name="advPayMethod" value="Cash" checked={paymentMethod === "Cash"} onChange={(e) => setPaymentMethod(e.target.value)} />
                                    <label className="form-check-label">Cash</label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input className="form-check-input" type="radio" name="advPayMethod" value="Online" checked={paymentMethod === "Online"} onChange={(e) => setPaymentMethod(e.target.value)} />
                                    <label className="form-check-label">Online</label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input className="form-check-input" type="radio" name="advPayMethod" value="Card" checked={paymentMethod === "Card"} onChange={(e) => setPaymentMethod(e.target.value)} />
                                    <label className="form-check-label">Card</label>
                                </div>
                            </div>

                            {/* BALANCE DISPLAY */}
                            <div className="d-flex justify-content-between align-items-center p-2">
                                <span className="fw-bold text-danger">Left Due Amount:</span>
                                <span className="fw-bold fs-5 text-danger">
                                    ₹ {balanceAmount.toFixed(2)}
                                </span>
                            </div>

                        </div>
                    </div>
                </div>

                <button className="btn btn-primary mt-3 btn-lg" disabled={!items.length || isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Processing...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-check-circle me-2"></i> Confirm Advance Order
                        </>
                    )}
                </button>
            </form>
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
