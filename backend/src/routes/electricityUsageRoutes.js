const express = require("express");
const router = express.Router();
const {
  createElectricityUsage,
  getAllElectricityUsages,
  getElectricityUsageById,
  updateElectricityUsage,
  deleteElectricityUsage,
} = require("../controllers/ElectricityUsage.controller");

router.post("/", createElectricityUsage);
router.get("/", getAllElectricityUsages);
router.get("/:id", getElectricityUsageById);
router.put("/:id", updateElectricityUsage);
router.delete("/:id", deleteElectricityUsage);

module.exports = router;
