import express from "express";

import {
  register,
  login,
  me,
  logout,
  createUser,
  changePassword,
} from "../controllers/auth.controller.js";

import {
  protect,
  authorize,
} from "../middleware/auth.js";

const router =
  express.Router();


/* =========================================================
   PUBLIC
========================================================= */

router.post(
  "/register",
  register
);

router.post(
  "/login",
  login
);


/* =========================================================
   PROTECTED
========================================================= */

router.get(
  "/me",
  protect,
  me
);

router.post(
  "/logout",
  protect,
  logout
);

router.put("/change-password", protect, changePassword);
/* =========================================================
   HR / SUPER ADMIN USER CREATION
========================================================= */

router.post(
  "/users",
  protect,
  authorize(
    "hr",
    "super_admin"
  ),
  createUser
);



export default router;