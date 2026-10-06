import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ["employee", "hr", "super_admin","attendance"], default: "employee" },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date
}, { timestamps: true });

schema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

schema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", schema);
