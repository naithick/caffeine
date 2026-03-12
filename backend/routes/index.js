/**
 * routes/index.js — Central router that mounts all sub-routers.
 */

const express = require("express");
const router = express.Router();

// ── Import controllers ──────────────────────────────────────
const { authUser } = require("../controllers/userController");
const {
  createProposal,
  getProposals,
} = require("../controllers/proposalController");
const {
  reviewProposal,
  autoVerifyProposal,
} = require("../controllers/verificationController");
const {
  createSellOrder,
  getSellOrders,
  createBuyOrder,
  getBuyOrders,
  retireCredit,
} = require("../controllers/marketplaceController");
const {
  verifyExternalRegistry,
} = require("../controllers/registryBridgeController");
const { verifyZKProof } = require("../controllers/zkVerificationController");
const {
  submitKYC,
  getKYCStatus,
  reviewKYC,
} = require("../controllers/kycController");
const {
  logCreditEvent,
  getCreditHistory,
  getUserHistory,
} = require("../controllers/creditHistoryController");
const {
  getNotifications,
  createNotification,
  markAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

// ── User routes ─────────────────────────────────────────────
router.post("/users/auth", authUser);

// ── KYC routes ──────────────────────────────────────────────
router.post("/kyc/submit", submitKYC);
router.get("/kyc/:userId", getKYCStatus);
router.post("/kyc/review", reviewKYC);

// ── Proposal routes ─────────────────────────────────────────
router.post("/proposals", createProposal);
router.get("/proposals", getProposals);

// ── Verification routes ─────────────────────────────────────
router.post("/verification/review", reviewProposal);
router.post("/verification/auto", autoVerifyProposal);

// ── Registry Bridge routes ──────────────────────────────────
router.post("/bridge/verify", verifyExternalRegistry);

// ── ZK Proof Verification routes ────────────────────────────
router.post("/zk/verify", verifyZKProof);

// ── Marketplace routes ──────────────────────────────────────
router.post("/marketplace/sell", createSellOrder);
router.get("/marketplace/sell", getSellOrders);
router.post("/marketplace/buy", createBuyOrder);
router.get("/marketplace/buy", getBuyOrders);
router.post("/marketplace/retire", retireCredit);

// ── Credit History routes ───────────────────────────────────
router.post("/history", logCreditEvent);
router.get("/history/credit/:creditId", getCreditHistory);
router.get("/history/user/:userId", getUserHistory);

// ── Notification routes ─────────────────────────────────────
router.get("/notifications/:userId", getNotifications);
router.post("/notifications", createNotification);
router.patch("/notifications/:id/read", markAsRead);
router.delete("/notifications/:id", deleteNotification);

module.exports = router;
