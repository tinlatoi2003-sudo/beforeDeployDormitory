const mongoose = require("mongoose");

const roomAssignmentSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: [true, "Sinh viên là bắt buộc"],
        },
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: [true, "Phòng là bắt buộc"],
        },
        buildingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Building",
            required: [true, "Tòa nhà là bắt buộc"],
        },
        termCode: {
            type: String,
            required: [true, "Mã kỳ học là bắt buộc"],
            trim: true,
        },
        startDate: {
            type: Date,
            required: [true, "Ngày bắt đầu là bắt buộc"],
        },
        endDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ["active", "ended", "cancelled"],
            default: "active",
        },
        note: {
            type: String,
            trim: true,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

module.exports = mongoose.model("RoomAssignment", roomAssignmentSchema);
