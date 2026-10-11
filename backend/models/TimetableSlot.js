const mongoose = require("mongoose");

const timetableSlotSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    section: { type: String, trim: true, default: "A" },
    day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], required: true },
    periodNumber: { type: Number, required: true },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "10:00"
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
    room: { type: String, trim: true },
  },
  { timestamps: true }
);

timetableSlotSchema.index({ branch: 1, year: 1, semester: 1, section: 1, day: 1, periodNumber: 1 }, { unique: true });
timetableSlotSchema.index({ faculty: 1, day: 1 });

module.exports = mongoose.model("TimetableSlot", timetableSlotSchema);
