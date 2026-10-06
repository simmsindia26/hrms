import { User } from "../models/User.js";

import {
  signToken,
} from "../utils/jwt.js";

import {
  env,
} from "../config/env.js";

import {
  success,
  created,
} from "../utils/apiResponse.js";


/* =========================================================
   REGISTER EMPLOYEE
========================================================= */

export async function register(req, res) {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const user =
      await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: "employee",
        isActive: true,
      });

    return created(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          employee: user.employee || null,
          isActive: user.isActive,
        },
      },
      "Employee account registered successfully."
    );
  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to register employee.",
    });
  }
}


/* =========================================================
   LOGIN
========================================================= */

export async function login(req, res) {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    /*
     * Password is select:false in User.js,
     * therefore explicitly select it.
     */
    const user =
      await User.findOne({
        email: normalizedEmail,
      }).select("+password");

    /* =====================================================
       LOGIN DEBUG
    ===================================================== */

    console.log(
      "LOGIN DEBUG:",
      {
        email: normalizedEmail,
        userFound: Boolean(user),
        isActive: user?.isActive,
        hasPassword: Boolean(
          user?.password
        ),
        role: user?.role,
        userId: user?._id?.toString(),
      }
    );

    /* =====================================================
       VALIDATE USER
    ===================================================== */

    if (!user) {
      console.log(
        "LOGIN FAILED: USER NOT FOUND"
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid credentials.",
      });
    }

    if (!user.isActive) {
      console.log(
        "LOGIN FAILED: USER INACTIVE"
      );

      return res.status(401).json({
        success: false,
        message:
          "Your account is inactive. Please contact HR/Admin.",
      });
    }

    if (!user.password) {
      console.log(
        "LOGIN FAILED: PASSWORD NOT FOUND"
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid credentials.",
      });
    }

    /* =====================================================
       CHECK PASSWORD
    ===================================================== */

    const passwordMatch =
      await user.comparePassword(
        password
      );

    console.log(
      "PASSWORD MATCH:",
      passwordMatch
    );

    if (!passwordMatch) {
      console.log(
        "LOGIN FAILED: PASSWORD MISMATCH"
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid credentials.",
      });
    }

    /* =====================================================
       UPDATE LAST LOGIN
       
       IMPORTANT:
       User.js has isModified("password"),
       so this save will NOT re-hash password.
    ===================================================== */

    user.lastLoginAt =
      new Date();

    await user.save();

    /* =====================================================
       JWT
    ===================================================== */

    const token =
      signToken({
        id: user._id.toString(),
        role: user.role,
      });

    /* =====================================================
       COOKIE
    ===================================================== */

    res.cookie(
      env.cookieName,
      token,
      {
        httpOnly: true,

        secure:
          env.nodeEnv ===
          "production",

        sameSite:
          env.nodeEnv ===
          "production"
            ? "none"
            : "lax",

        maxAge:
          7 *
          24 *
          60 *
          60 *
          1000,
      }
    );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return success(
      res,
      {
        token,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          employee:
            user.employee || null,
          isActive:
            user.isActive,
          lastLoginAt:
            user.lastLoginAt,
        },
      },
      "Login successful."
    );
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Login failed. Please try again.",
    });
  }
}


/* =========================================================
   CURRENT USER
========================================================= */

export async function me(req, res) {
  try {
    return success(
      res,
      {
        user: req.user,
      },
      "Current user."
    );
  } catch (error) {
    console.error(
      "ME ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get current user.",
    });
  }
}


/* =========================================================
   LOGOUT
========================================================= */

export async function logout(req, res) {
  try {
    res.clearCookie(
      env.cookieName,
      {
        httpOnly: true,

        secure:
          env.nodeEnv ===
          "production",

        sameSite:
          env.nodeEnv ===
          "production"
            ? "none"
            : "lax",
      }
    );

    return success(
      res,
      null,
      "Logged out."
    );
  } catch (error) {
    console.error(
      "LOGOUT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Logout failed.",
    });
  }
}


/* =========================================================
   CREATE USER
   HR / SUPER ADMIN
========================================================= */

export async function createUser(
  req,
  res
) {
  try {
    const {
      name,
      email,
      password,
      role = "employee",
      employee,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters.",
      });
    }

    const allowedRoles = [
      "employee",
      "hr",
      "super_admin",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user role.",
      });
    }

    /*
     * HR can only create employee accounts.
     */
    if (
      req.user?.role === "hr" &&
      (
        role === "hr" ||
        role === "super_admin"
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "HR Admin can only create employee accounts.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists.",
      });
    }

    const user =
      await User.create({
        name: name.trim(),

        email: normalizedEmail,

        password,

        role,

        employee:
          employee || null,

        isActive: true,
      });

    return created(
      res,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employee:
          user.employee || null,
        isActive:
          user.isActive,
      },
      "User created successfully."
    );
  } catch (error) {
    console.error(
      "CREATE USER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create user.",
    });
  }
}


/* =========================================================
   CHANGE PASSWORD
   ALL AUTHENTICATED USERS
========================================================= */

export async function changePassword(
  req,
  res
) {
  try {
    const userId =
      req.user?._id ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthorized.",
      });
    }

    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters long.",
      });
    }

    const user =
      await User.findById(
        userId
      ).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    /* =====================================================
       VERIFY CURRENT PASSWORD
    ===================================================== */

    const currentPasswordMatch =
      await user.comparePassword(
        currentPassword
      );

    if (!currentPasswordMatch) {
      return res.status(400).json({
        success: false,
        message:
          "Current password is incorrect.",
      });
    }

    /* =====================================================
       PREVENT SAME PASSWORD
    ===================================================== */

    const samePassword =
      await user.comparePassword(
        newPassword
      );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from current password.",
      });
    }

    /*
     * IMPORTANT:
     *
     * DO NOT bcrypt.hash() here.
     *
     * User.js already contains:
     *
     * schema.pre("save", async function(next) {
     *   if (!this.isModified("password"))
     *     return next();
     *
     *   this.password =
     *     await bcrypt.hash(this.password, 12);
     *
     *   next();
     * });
     *
     * Therefore assigning the plain password
     * here causes it to be hashed exactly once.
     */

    user.password =
      newPassword;

    await user.save();

    console.log(
      "PASSWORD CHANGED:",
      {
        userId:
          user._id.toString(),
        email:
          user.email,
        role:
          user.role,
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully.",
    });
  } catch (error) {
    console.error(
      "CHANGE PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to change password.",
    });
  }
}

