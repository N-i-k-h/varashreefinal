const mongoose = require("mongoose");

const plantSchema = new mongoose.Schema(
  {
    plantName: { type: String, required: true },
    botanicalName: String,
    description: String,
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    size: String,
    light: String,
    water: String,
    category: String,
    image: String,
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
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

const Plant = mongoose.model("Plant", plantSchema);
module.exports = Plant;
