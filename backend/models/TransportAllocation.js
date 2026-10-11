const mongoose = require("mongoose");

const transportAllocationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, unique: true },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
    stop: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TransportAllocation", transportAllocationSchema);
