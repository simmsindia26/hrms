import express from "express";

import {
  protect,
  authorize,
} from "../middleware/auth.js";

import {
  approveSelection,
  rejectCandidate,
  markOfferSent,
  acceptOffer,
  declineOffer,
  joinCandidate,
} from "../controllers/recruitment.controller.js";

const router = express.Router();

router.use(protect);

router.patch(
  "/candidates/:id/approve",
  authorize("hr", "super_admin"),
  approveSelection
);

router.patch(
  "/candidates/:id/reject",
  authorize("hr", "super_admin"),
  rejectCandidate
);

router.patch(
  "/candidates/:id/offer-sent",
  authorize("hr", "super_admin"),
  markOfferSent
);

router.patch(
  "/candidates/:id/offer-accept",
  authorize("hr", "super_admin"),
  acceptOffer
);

router.patch(
  "/candidates/:id/offer-decline",
  authorize("hr", "super_admin"),
  declineOffer
);

router.post(
  "/candidates/:id/join",
  authorize("hr", "super_admin"),
  joinCandidate
);

export default router;