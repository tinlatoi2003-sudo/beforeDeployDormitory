const ViolationRecord = require("../models/ViolationRecord");
require("../models/Student");
require("../models/Room");
require("../models/User");
require("../models/Invoice");

const createViolationRecord = async (req, res) => {
  try {
    const violationRecord = new ViolationRecord(req.body);
    const savedViolationRecord = await violationRecord.save();
    res.status(201).json(savedViolationRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllViolationRecords = async (req, res) => {
  try {
    const { status, type, studentId, roomId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (studentId) filter.studentId = studentId;
    if (roomId) filter.roomId = roomId;

    const violationRecords = await ViolationRecord.find(filter)
      .populate("studentId", "studentCode fullName")
      .populate("roomId", "roomNumber floor")
      .populate("reportedBy", "username email")
      .populate("invoiceId", "invoiceCode status amount")
      .sort({ createdAt: -1 });

    res.status(200).json(violationRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getViolationRecordById = async (req, res) => {
  try {
    const violationRecord = await ViolationRecord.findById(req.params.id)
      .populate("studentId", "studentCode fullName")
      .populate("roomId", "roomNumber floor")
      .populate("reportedBy", "username email")
      .populate("invoiceId", "invoiceCode status amount");

    if (!violationRecord) {
      return res.status(404).json({ message: "Violation record not found" });
    }

    res.status(200).json(violationRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateViolationRecord = async (req, res) => {
  try {
    const allowedFields = [
      "studentId",
      "roomId",
      "type",
      "description",
      "fineAmount",
      "invoiceId",
      "reportedBy",
      "evidence",
      "status",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const updatedViolationRecord = await ViolationRecord.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedViolationRecord) {
      return res.status(404).json({ message: "Violation record not found" });
    }

    res.status(200).json(updatedViolationRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateViolationRecordStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["reported", "invoiced", "resolved"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedViolationRecord = await ViolationRecord.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!updatedViolationRecord) {
      return res.status(404).json({ message: "Violation record not found" });
    }

    res.status(200).json(updatedViolationRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteViolationRecord = async (req, res) => {
  try {
    const deletedViolationRecord = await ViolationRecord.findByIdAndDelete(req.params.id);

    if (!deletedViolationRecord) {
      return res.status(404).json({ message: "Violation record not found" });
    }

    res.status(200).json({ message: "Violation record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createViolationRecord,
  getAllViolationRecords,
  getViolationRecordById,
  updateViolationRecord,
  updateViolationRecordStatus,
  deleteViolationRecord,
};
