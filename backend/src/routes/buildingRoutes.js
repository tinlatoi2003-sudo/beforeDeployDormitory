const express = require("express");
const router = express.Router();
const {
  createBuilding,
  getAllBuildings,
  getBuildingById,
  updateBuilding,
  deleteBuilding,
  updateBuildingStatus,
  getBuildingsByStatus,
  searchBuildings,
  getBuildingsByManager,
  getBuildingStats,
  getAllBuildingStats,
} = require("../controllers/Building.controller");

// ===== Thống kê (đặt trước :id để tránh conflict) =====
router.get("/stats", getAllBuildingStats);
router.get("/stats/:id", getBuildingStats);

// ===== Tìm kiếm / Lọc =====
router.get("/search", searchBuildings);
router.get("/status/:status", getBuildingsByStatus);
router.get("/manager/:managerId", getBuildingsByManager);

// ===== CRUD =====
router.post("/", createBuilding);
router.get("/", getAllBuildings);
router.get("/:id", getBuildingById);
router.put("/:id", updateBuilding);
router.delete("/:id", deleteBuilding);

// ===== Quản lý trạng thái =====
router.patch("/:id/status", updateBuildingStatus);

module.exports = router;
