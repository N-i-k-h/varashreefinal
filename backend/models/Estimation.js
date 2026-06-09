const mongoose = require("mongoose");

const estimationItemSchema = new mongoose.Schema(
  {
    plantId: { type: mongoose.Schema.Types.ObjectId, ref: "Plant" },
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

const estimationSchema = new mongoose.Schema(
  {
    estimateNo: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerContact: String,
    customerAddress: String,
    totalItems: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    items: [estimationItemSchema],
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

const Estimation = mongoose.model("Estimation", estimationSchema);
const EstimationItem = mongoose.model("EstimationItem", estimationItemSchema);

module.exports = { Estimation, EstimationItem };
