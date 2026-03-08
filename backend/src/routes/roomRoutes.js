const express = require("express");
const router = express.Router();
const {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
  addOccupant,
  removeOccupant,
  getRoomsByBuilding,
  getRoomsByStatus,
  getRoomsByType,
  searchRooms,
  getAvailableRooms,
  getFullRooms,
} = require("../controllers/Room.controller");

// ===== Thống kê (đặt trước các route có :id để tránh conflict) =====
router.get("/available", getAvailableRooms);
router.get("/full", getFullRooms);

// ===== Tìm kiếm / Lọc =====
router.get("/search", searchRooms);
router.get("/building/:buildingId", getRoomsByBuilding);
router.get("/status/:status", getRoomsByStatus);
router.get("/type/:type", getRoomsByType);

// ===== CRUD =====
router.post("/", createRoom);
router.get("/", getAllRooms);
router.get("/:id", getRoomById);
router.put("/:id", updateRoom);
router.delete("/:id", deleteRoom);

// ===== Quản lý trạng thái =====
router.patch("/:id/status", updateRoomStatus);

// ===== Quản lý số người =====
router.patch("/:id/add-occupant", addOccupant);
router.patch("/:id/remove-occupant", removeOccupant);

module.exports = router;
