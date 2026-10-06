import mongoose from "mongoose";
export const Notification = mongoose.model("Notification", new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  message: String,
  type: { type: String, default: "info" },
  read: { type: Boolean, default: false },
  link: String
}, { timestamps: true }));
