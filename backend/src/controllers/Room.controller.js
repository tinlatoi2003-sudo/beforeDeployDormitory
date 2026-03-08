const Room = require("../models/Room");
require("../models/Building"); // Đảm bảo model Building được đăng ký cho populate

// ========================
// 1. CRUD Phòng
// ========================

// Thêm phòng mới
const createRoom = async (req, res) => {
  try {
    const {
      buildingId,
      roomNumber,
      floor,
      type,
      maxOccupancy,
      pricePerTerm,
      amenities,
      description,
    } = req.body;

    // Kiểm tra phòng đã tồn tại chưa (cùng tòa nhà + số phòng)
    const existingRoom = await Room.findOne({ buildingId, roomNumber });
    if (existingRoom) {
      return res
        .status(400)
        .json({ message: "Phòng này đã tồn tại trong tòa nhà" });
    }

    const newRoom = new Room({
      buildingId,
      roomNumber,
      floor,
      type,
      maxOccupancy,
      pricePerTerm,
      amenities,
      description,
    });

    const savedRoom = await newRoom.save();
    res.status(201).json(savedRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh sách tất cả phòng
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true }).populate(
      "buildingId",
      "name address",
    );
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy chi tiết 1 phòng
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate(
      "buildingId",
      "name address",
    );
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cập nhật thông tin phòng
const updateRoom = async (req, res) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!updatedRoom) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    res.status(200).json(updatedRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa phòng (soft delete bằng isActive = false)
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    res
      .status(200)
      .json({ message: "Đã xóa phòng thành công (soft delete)", room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================
// 2. Quản lý trạng thái phòng
// ========================

// Cập nhật trạng thái phòng
const updateRoomStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["available", "partial", "full", "maintenance"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}`,
      });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================
// 3. Quản lý số người trong phòng
// ========================

// Helper: tự động cập nhật status dựa trên currentOccupancy
const autoUpdateStatus = (room) => {
  if (room.currentOccupancy === 0) {
    room.status = "available";
  } else if (room.currentOccupancy >= room.maxOccupancy) {
    room.status = "full";
  } else {
    room.status = "partial";
  }
};

// Thêm sinh viên vào phòng (currentOccupancy++)
const addOccupant = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    if (room.currentOccupancy >= room.maxOccupancy) {
      return res
        .status(400)
        .json({ message: "Phòng đã đầy, không thể thêm người" });
    }

    if (room.status === "maintenance") {
      return res
        .status(400)
        .json({ message: "Phòng đang bảo trì, không thể thêm người" });
    }

    room.currentOccupancy += 1;
    autoUpdateStatus(room);
    await room.save();

    res.status(200).json({ message: "Đã thêm người vào phòng", room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa sinh viên khỏi phòng (currentOccupancy--)
const removeOccupant = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    if (room.currentOccupancy <= 0) {
      return res
        .status(400)
        .json({ message: "Phòng đã trống, không thể xóa người" });
    }

    room.currentOccupancy -= 1;
    autoUpdateStatus(room);
    await room.save();

    res.status(200).json({ message: "Đã xóa người khỏi phòng", room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================
// 4. Tìm kiếm / Lọc phòng
// ========================

// Phòng theo tòa nhà
const getRoomsByBuilding = async (req, res) => {
  try {
    const rooms = await Room.find({
      buildingId: req.params.buildingId,
      isActive: true,
    }).populate("buildingId", "name address");

    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lọc theo trạng thái
const getRoomsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["available", "partial", "full", "maintenance"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}`,
      });
    }

    const rooms = await Room.find({ status, isActive: true }).populate(
      "buildingId",
      "name address",
    );
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lọc theo loại phòng
const getRoomsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ["standard", "vip", "premium"];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: `Loại phòng không hợp lệ. Chỉ chấp nhận: ${validTypes.join(", ")}`,
      });
    }

    const rooms = await Room.find({ type, isActive: true }).populate(
      "buildingId",
      "name address",
    );
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tìm kiếm phòng theo roomNumber, floor, price
const searchRooms = async (req, res) => {
  try {
    const { roomNumber, floor, minPrice, maxPrice } = req.query;
    const filter = { isActive: true };

    if (roomNumber) {
      filter.roomNumber = { $regex: roomNumber, $options: "i" };
    }
    if (floor) {
      filter.floor = Number(floor);
    }
    if (minPrice || maxPrice) {
      filter.pricePerTerm = {};
      if (minPrice) filter.pricePerTerm.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerTerm.$lte = Number(maxPrice);
    }

    const rooms = await Room.find(filter).populate(
      "buildingId",
      "name address",
    );
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================
// 5. Thống kê
// ========================

// Danh sách phòng còn chỗ (available hoặc partial)
const getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      status: { $in: ["available", "partial"] },
      isActive: true,
    }).populate("buildingId", "name address");

    res.status(200).json({
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Danh sách phòng đã đầy
const getFullRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      status: "full",
      isActive: true,
    }).populate("buildingId", "name address");

    res.status(200).json({
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================
// Export tất cả
// ========================
module.exports = {
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
};
