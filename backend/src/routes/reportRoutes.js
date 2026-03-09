const express = require("express");
const router = express.Router();
const {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  reviewReport,
  getPendingReports,
  deleteReport,
} = require("../controllers/Report.controller");

router.get("/pending", getPendingReports);
router.post("/", createReport);
router.get("/", getAllReports);
router.get("/:id", getReportById);
router.put("/:id", updateReport);
router.patch("/:id/review", reviewReport);
router.delete("/:id", deleteReport);

module.exports = router;
