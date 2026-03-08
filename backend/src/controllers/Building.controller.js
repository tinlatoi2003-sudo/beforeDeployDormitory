const Building = require("../models/Building");
const Room = require("../models/Room");
require("../models/User"); // Đảm bảo model User được đăng ký cho populate

// ========================
// 1. CRUD Tòa nhà
// ========================

// Thêm tòa nhà mới
const createBuilding = async (req, res) => {
  try {
    const { name, address, totalFloors, description, managerId } = req.body;

    // Kiểm tra tên tòa nhà đã tồn tại chưa
    const existingBuilding = await Building.findOne({ name });
    if (existingBuilding) {
      return res.status(400).json({ message: "Tên tòa nhà đã tồn tại" });
    }

    const newBuilding = new Building({
      name,
      address,
      totalFloors,
      description,
      managerId,
    });

    const savedBuilding = await newBuilding.save();
    res.status(201).json(savedBuilding);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh sách tất cả tòa nhà (trừ inactive)
const getAllBuildings = async (req, res) => {
  try {
    const buildings = await Building.find({
      status: { $ne: "inactive" },
    }).populate("managerId", "username email phone");

    res.status(200).json(buildings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy chi tiết 1 tòa nhà
const getBuildingById = async (req, res) => {
  try {
    const building = await Building.findById(req.params.id).populate(
      "managerId",
      "username email phone",
    );

    if (!building) {
      return res.status(404).json({ message: "Không tìm thấy tòa nhà" });
    }
    res.status(200).json(building);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cập nhật thông tin tòa nhà
const updateBuilding = async (req, res) => {
  try {
    // Nếu đổi tên, kiểm tra trùng
    if (req.body.name) {
      const existing = await Building.findOne({
        name: req.body.name,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({ message: "Tên tòa nhà đã tồn tại" });
      }
    }

    const updatedBuilding = await Building.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!updatedBuilding) {
      return res.status(404).json({ message: "Không tìm thấy tòa nhà" });
    }
    res.status(200).json(updatedBuilding);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa tòa nhà (soft delete bằng status = "inactive")
const deleteBuilding = async (req, res) => {
  try {
    const building = await Building.findByIdAndUpdate(
      req.params.id,
      { status: "inactive" },
      { new: true },
    );

    if (!building) {
      return res.status(404).json({ message: "Không tìm thấy tòa nhà" });
    }
    res
      .status(200)
      .json({ message: "Đã xóa tòa nhà thành công (soft delete)", building });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================
// 2. Quản lý trạng thái tòa nhà
// ========================

// Cập nhật trạng thái tòa nhà
const updateBuildingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["active", "inactive", "maintenance"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}`,
      });
    }

    const building = await Building.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!building) {
      return res.status(404).json({ message: "Không tìm thấy tòa nhà" });
    }
    res.status(200).json(building);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================
// 3. Tìm kiếm / Lọc tòa nhà
// ========================

// Lọc theo trạng thái
const getBuildingsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["active", "inactive", "maintenance"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}`,
      });
    }

    const buildings = await Building.find({ status }).populate(
      "managerId",
      "username email phone",
    );
    res.status(200).json(buildings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tìm kiếm theo tên hoặc địa chỉ
const searchBuildings = async (req, res) => {
  try {
    const { name, address } = req.query;
    const filter = { status: { $ne: "inactive" } };

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }
    if (address) {
      filter.address = { $regex: address, $options: "i" };
    }

    const buildings = await Building.find(filter).populate(
      "managerId",
      "username email phone",
    );
    res.status(200).json(buildings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lọc theo manager
const getBuildingsByManager = async (req, res) => {
  try {
    const buildings = await Building.find({
      managerId: req.params.managerId,
      status: { $ne: "inactive" },
    }).populate("managerId", "username email phone");

    res.status(200).json(buildings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================
// 4. Thống kê tòa nhà
// ========================

// Thống kê số phòng, phòng trống, phòng đầy của từng tòa nhà
const getBuildingStats = async (req, res) => {
  try {
    const buildingId = req.params.id;

    const building = await Building.findById(buildingId).populate(
      "managerId",
      "username email phone",
    );

    if (!building) {
      return res.status(404).json({ message: "Không tìm thấy tòa nhà" });
    }

    const totalRooms = await Room.countDocuments({
      buildingId,
      isActive: true,
    });
    const availableRooms = await Room.countDocuments({
      buildingId,
      isActive: true,
      status: { $in: ["available", "partial"] },
    });
    const fullRooms = await Room.countDocuments({
      buildingId,
      isActive: true,
      status: "full",
    });
    const maintenanceRooms = await Room.countDocuments({
      buildingId,
      isActive: true,
      status: "maintenance",
    });

    res.status(200).json({
      building,
      stats: {
        totalRooms,
        availableRooms,
        fullRooms,
        maintenanceRooms,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Thống kê tổng quan tất cả tòa nhà
const getAllBuildingStats = async (req, res) => {
  try {
    const buildings = await Building.find({
      status: { $ne: "inactive" },
    }).populate("managerId", "username email phone");

    const stats = await Promise.all(
      buildings.map(async (building) => {
        const totalRooms = await Room.countDocuments({
          buildingId: building._id,
          isActive: true,
        });
        const availableRooms = await Room.countDocuments({
          buildingId: building._id,
          isActive: true,
          status: { $in: ["available", "partial"] },
        });
        const fullRooms = await Room.countDocuments({
          buildingId: building._id,
          isActive: true,
          status: "full",
        });

        return {
          building,
          totalRooms,
          availableRooms,
          fullRooms,
        };
      }),
    );

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================
// Export tất cả
// ========================
module.exports = {
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
};
