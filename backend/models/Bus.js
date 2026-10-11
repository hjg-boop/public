const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
  {
    busNumber: { type: String, required: true, unique: true, trim: true },
    routeName: { type: String, required: true, trim: true },
    driverName: { type: String, trim: true },
    driverPhone: { type: String, trim: true },
    stops: [
      {
        name: { type: String, required: true, trim: true },
        time: { type: String, trim: true }, // "08:15 AM"
      },
    ],
    capacity: { type: Number, default: 40 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bus", busSchema);
