import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { User } from "./src/models/User.js";

dotenv.config();

const EMAIL = "ommkardwibedi2003@gmail.com";
const NEW_PASSWORD = "ChangeMe@123";

async function resetSuperAdminPassword() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log("MongoDB connected.");

    const user =
      await User.findOne({
        email: EMAIL.toLowerCase(),
      }).select("+password");

    if (!user) {
      console.log(
        "Super Admin user not found."
      );
      process.exit(1);
    }

    console.log("User found:", {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });

    /*
     * IMPORTANT:
     *
     * We assign the plain password and
     * save the document.
     *
     * User.js pre-save middleware will
     * hash it exactly once.
     */
    user.password = NEW_PASSWORD;

    user.role = "super_admin";
    user.isActive = true;

    await user.save();

    console.log(
      "Super Admin password reset successfully."
    );

    /*
     * Verify immediately.
     */
    const passwordWorks =
      await user.comparePassword(
        NEW_PASSWORD
      );

    console.log(
      "Password verification:",
      passwordWorks
    );

    if (!passwordWorks) {
      console.error(
        "ERROR: Password verification failed."
      );
      process.exit(1);
    }

    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      "SUPER ADMIN LOGIN"
    );
    console.log(
      "========================================"
    );
    console.log(
      "Email:",
      user.email
    );
    console.log(
      "Password:",
      NEW_PASSWORD
    );
    console.log(
      "Role:",
      user.role
    );
    console.log(
      "========================================"
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "PASSWORD RESET ERROR:",
      error
    );

    process.exit(1);
  }
}

resetSuperAdminPassword();