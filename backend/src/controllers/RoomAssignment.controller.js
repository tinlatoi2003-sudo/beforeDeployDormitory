const RoomAssignment = require("../models/RoomAssignment");
const Room = require("../models/Room");
const Student = require("../models/Student");
require("../models/Building"); // Đảm bảo model Building được đăng ký cho populate

// Helper: tự động cập nhật status phòng dựa trên currentOccupancy
const autoUpdateRoomStatus = (room) => {
  if (room.currentOccupancy === 0) {
    room.status = "available";
  } else if (room.currentOccupancy >= room.maxOccupancy) {
    room.status = "full";
  } else {
    room.status = "partial";
  }
};

// ========================
// 1. CRUD Xếp phòng
// ========================

// Tạo assignment mới (xếp sinh viên vào phòng)
const createAssignment = async (req, res) => {
  try {
    const { studentId, roomId, buildingId, termCode, startDate, note } =
      req.body;

    // Kiểm tra sinh viên đã có phòng active chưa
    const existingAssignment = await RoomAssignment.findOne({
      studentId,
      status: "active",
    });
    if (existingAssignment) {
      return res.status(400).json({
        message:
          "Sinh viên này đã có phòng đang ở. Hãy kết thúc hoặc hủy assignment cũ trước.",
      });
    }

    // Kiểm tra phòng có tồn tại và còn chỗ không
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    if (!room.isActive) {
      return res
        .status(400)
        .json({ message: "Phòng đã bị xóa, không thể xếp" });
    }
    if (room.status === "maintenance") {
      return res
        .status(400)
        .json({ message: "Phòng đang bảo trì, không thể xếp" });
    }
    if (room.currentOccupancy >= room.maxOccupancy) {
      return res
        .status(400)
        .json({ message: "Phòng đã đầy, không thể xếp thêm" });
    }

    // Kiểm tra sinh viên tồn tại
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    // Tạo assignment
    const newAssignment = new RoomAssignment({
      studentId,
      roomId,
      buildingId,
      termCode,
      startDate,
      note,
    });

    const savedAssignment = await newAssignment.save();

    // Tăng currentOccupancy của phòng + cập nhật status
    room.currentOccupancy += 1;
    autoUpdateRoomStatus(room);
    await room.save();

    // Cập nhật currentRoomId của sinh viên
    student.currentRoomId = roomId;
    await student.save();

    res.status(201).json(savedAssignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy tất cả assignments
const getAllAssignments = async (req, res) => {
  try {
    const assignments = await RoomAssignment.find()
      .populate("studentId", "studentCode fullName gender faculty")
      .populate("roomId", "roomNumber floor type")
      .populate("buildingId", "name address");

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy chi tiết 1 assignment
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await RoomAssignment.findById(req.params.id)
      .populate("studentId", "studentCode fullName gender faculty")
      .populate("roomId", "roomNumber floor type maxOccupancy currentOccupancy")
      .populate("buildingId", "name address");

    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy bản ghi xếp phòng" });
    }
    res.status(200).json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cập nhật thông tin assignment (note, termCode...)
const updateAssignment = async (req, res) => {
  try {
    // Chỉ cho phép cập nhật một số field
    const allowedFields = ["note", "termCode", "startDate", "endDate"];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const updatedAssignment = await RoomAssignment.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedAssignment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy bản ghi xếp phòng" });
    }
    res.status(200).json(updatedAssignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================
// 2. Kết thúc / Hủy assignment
// ========================

// Kết thúc lưu trú (status → ended)
const endAssignment = async (req, res) => {
  try {
    const assignment = await RoomAssignment.findById(req.params.id);
    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy bản ghi xếp phòng" });
    }

    if (assignment.status !== "active") {
      return res.status(400).json({
        message: "Chỉ có thể kết thúc assignment đang active",
      });
    }

    // Cập nhật assignment
    assignment.status = "ended";
    assignment.endDate = req.body.endDate || new Date();
    await assignment.save();

    // Giảm currentOccupancy của phòng
    const room = await Room.findById(assignment.roomId);
    if (room) {
      room.currentOccupancy = Math.max(0, room.currentOccupancy - 1);
      autoUpdateRoomStatus(room);
      await room.save();
    }

    // Xóa currentRoomId của sinh viên
    await Student.findByIdAndUpdate(assignment.studentId, {
      currentRoomId: null,
    });

    res
      .status(200)
      .json({ message: "Đã kết thúc lưu trú thành công", assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Hủy assignment (status → cancelled)
const cancelAssignment = async (req, res) => {
  try {
    const assignment = await RoomAssignment.findById(req.params.id);
    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy bản ghi xếp phòng" });
    }

    if (assignment.status !== "active") {
      return res.status(400).json({
        message: "Chỉ có thể hủy assignment đang active",
      });
    }

    // Cập nhật assignment
    assignment.status = "cancelled";
    assignment.endDate = new Date();
    if (req.body.note) {
      assignment.note = req.body.note;
    }
    await assignment.save();

    // Giảm currentOccupancy của phòng
    const room = await Room.findById(assignment.roomId);
    if (room) {
      room.currentOccupancy = Math.max(0, room.currentOccupancy - 1);
      autoUpdateRoomStatus(room);
      await room.save();
    }

    // Xóa currentRoomId của sinh viên
    await Student.findByIdAndUpdate(assignment.studentId, {
      currentRoomId: null,
    });

    res
      .status(200)
      .json({ message: "Đã hủy xếp phòng thành công", assignment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================
// 3. Tìm kiếm / Lọc
// ========================

// Lọc theo sinh viên
const getAssignmentsByStudent = async (req, res) => {
  try {
    const assignments = await RoomAssignment.find({
      studentId: req.params.studentId,
    })
      .populate("roomId", "roomNumber floor type")
      .populate("buildingId", "name address")
      .sort({ createdAt: -1 });

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lọc theo phòng
const getAssignmentsByRoom = async (req, res) => {
  try {
    const assignments = await RoomAssignment.find({
      roomId: req.params.roomId,
    })
      .populate("studentId", "studentCode fullName gender faculty")
      .populate("buildingId", "name address")
      .sort({ createdAt: -1 });

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lọc theo tòa nhà
const getAssignmentsByBuilding = async (req, res) => {
  try {
    const assignments = await RoomAssignment.find({
      buildingId: req.params.buildingId,
    })
      .populate("studentId", "studentCode fullName gender faculty")
      .populate("roomId", "roomNumber floor type")
      .sort({ createdAt: -1 });

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lọc theo kỳ học
const getAssignmentsByTerm = async (req, res) => {
  try {
    const assignments = await RoomAssignment.find({
      termCode: req.params.termCode,
    })
      .populate("studentId", "studentCode fullName gender faculty")
      .populate("roomId", "roomNumber floor type")
      .populate("buildingId", "name address")
      .sort({ createdAt: -1 });

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lọc theo trạng thái
const getAssignmentsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["active", "ended", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}`,
      });
    }

    const assignments = await RoomAssignment.find({ status })
      .populate("studentId", "studentCode fullName gender faculty")
      .populate("roomId", "roomNumber floor type")
      .populate("buildingId", "name address")
      .sort({ createdAt: -1 });

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Danh sách assignment đang active
const getActiveAssignments = async (req, res) => {
  try {
    const assignments = await RoomAssignment.find({ status: "active" })
      .populate("studentId", "studentCode fullName gender faculty")
      .populate("roomId", "roomNumber floor type")
      .populate("buildingId", "name address")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================
// Export tất cả
// ========================
module.exports = {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  endAssignment,
  cancelAssignment,
  getAssignmentsByStudent,
  getAssignmentsByRoom,
  getAssignmentsByBuilding,
  getAssignmentsByTerm,
  getAssignmentsByStatus,
  getActiveAssignments,
};
