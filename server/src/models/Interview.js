import mongoose from "mongoose";
export const Interview = mongoose.model("Interview", new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
  scheduledAt: { type: Date, required: true },
  type: { type: String, enum: ["virtual", "physical"], default: "virtual" },
  locationOrLink: String,
  interviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["scheduled", "completed", "cancelled", "rescheduled"], default: "scheduled" },
  rating: { type: Number, min: 0, max: 10 },
  feedback: String
}, { timestamps: true }));
