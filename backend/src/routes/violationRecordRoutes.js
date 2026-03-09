const express = require("express");
const router = express.Router();
const {
  createViolationRecord,
  getAllViolationRecords,
  getViolationRecordById,
  updateViolationRecord,
  updateViolationRecordStatus,
  deleteViolationRecord,
} = require("../controllers/ViolationRecord.controller");

router.post("/", createViolationRecord);
router.get("/", getAllViolationRecords);
router.get("/:id", getViolationRecordById);
router.put("/:id", updateViolationRecord);
router.patch("/:id/status", updateViolationRecordStatus);
router.delete("/:id", deleteViolationRecord);

module.exports = router;
