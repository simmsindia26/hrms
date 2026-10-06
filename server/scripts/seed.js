import "../src/config/env.js";
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { User } from "../src/models/User.js";

await mongoose.connect(env.mongodbUri);

const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env before running the seed.");
  process.exit(1);
}

const existing = await User.findOne({ email });
if (existing) {
  console.log("Super Admin already exists.");
} else {
  await User.create({
    name: process.env.SUPER_ADMIN_NAME || "Sellopedia Super Admin",
    email,
    password,
    role: "super_admin"
  });
  console.log("Super Admin created.");
}

await mongoose.disconnect();
