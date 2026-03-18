const mongoose = require("mongoose");
// Mô hình dữ liệu cho phân công phòng của sinh viên
// Mỗi phân công sẽ liên kết một sinh viên với một phòng trong một kỳ học cụ thể, cùng với thông tin về ngày bắt đầu, ngày kết thúc, trạng thái và ghi chú (nếu có).

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
