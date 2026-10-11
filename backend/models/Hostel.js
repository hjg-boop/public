const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, trim: true },
    capacity: { type: Number, default: 2 },
    occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  },
  { _id: true }
);

const hostelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["Boys", "Girls"], required: true },
    warden: { type: String, trim: true },
    wardenPhone: { type: String, trim: true },
    rooms: [roomSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hostel", hostelSchema);
