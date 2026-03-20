const Report = require("../models/Report");
require("../models/User");
require("../models/Building");

const createReport = async (req, res) => {
  try {
    const report = new Report(req.body);
    const savedReport = await report.save();
    res.status(201).json(savedReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllReports = async (req, res) => {
  try {
    const { status, type, managerId, buildingId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (managerId) filter.managerId = managerId;
    if (buildingId) filter.buildingId = buildingId;

    const reports = await Report.find(filter)
      .populate("managerId", "username email")
      .populate("buildingId", "name address")
      .populate("adminReview.reviewedBy", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("managerId", "username email")
      .populate("buildingId", "name address")
      .populate("adminReview.reviewedBy", "username email");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateReport = async (req, res) => {
  try {
    const allowedFields = [
      "managerId",
      "buildingId",
      "title",
      "content",
      "type",
      "attachments",
      "status",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedReport) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json(updatedReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const reviewReport = async (req, res) => {
  try {
    const { reviewedBy, note } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.status = "reviewed";
    report.adminReview = {
      reviewedBy,
      note: note || "",
      reviewedAt: new Date(),
    };

    const updatedReport = await report.save();
    res.status(200).json(updatedReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPendingReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: "pending" })
      .populate("managerId", "username email")
      .populate("buildingId", "name address")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: reports.length, reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    const deletedReport = await Report.findByIdAndDelete(req.params.id);

    if (!deletedReport) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  reviewReport,
  getPendingReports,
  deleteReport,
};
