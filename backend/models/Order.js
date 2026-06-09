const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    plantId: { type: mongoose.Schema.Types.ObjectId, ref: "Plant", required: true },
    plantName: { type: String, required: true },
    rate: { type: Number, required: true },
    quantity: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true },
    customerName: { type: String, required: true },
    customerContact: String,
    customerAddress: String,
    employeeName: String,
    subTotal: Number,
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grandTotal: Number,
    paidAmount: Number,
    balanceAmount: { type: Number, default: 0 },
    finalPaymentDate: { type: Date, default: null },
    paymentMethod: { type: String, default: "Cash" },
    status: {
      type: String,
      enum: ["Paid", "Pending", "Cancelled"],
      default: "Paid",
    },
    orderItems: [orderItemSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

const Order = mongoose.model("Order", orderSchema);
const OrderItem = mongoose.model("OrderItem", orderItemSchema);

module.exports = { Order, OrderItem };
