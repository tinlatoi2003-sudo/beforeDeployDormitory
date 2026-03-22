const Building = require("../models/Building");
const Room = require("../models/Room");

// GET /api/buildings
exports.getBuildings = async (req, res) => {
    try {
        const buildings = await Building.find()
            .populate("managerId", "username email")
            .sort({ name: 1 });
        res.json({ success: true, data: buildings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/buildings
exports.createBuilding = async (req, res) => {
    try {
        const { name, address, totalFloors, description, managerId, status } = req.body;
        if (!name || !totalFloors) {
            return res.status(400).json({
                success: false,
                message: "name va totalFloors la bat buoc",
            });
        }

        const building = await Building.create({
            name,
            address,
            totalFloors,
            description,
            managerId: managerId || null,
            status: status || "active",
        });

        res.status(201).json({
            success: true,
            message: "Tao toa nha thanh cong",
            data: building,
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Ten toa nha da ton tai",
            });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/buildings/:id
exports.updateBuilding = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, totalFloors, description, managerId, status } = req.body;

        const building = await Building.findByIdAndUpdate(
            id,
            {
                name,
                address,
                totalFloors,
                description,
                managerId: managerId || null,
                status,
            },
            { new: true, runValidators: true }
        );

        if (!building) {
            return res.status(404).json({ success: false, message: "Khong tim thay toa nha" });
        }

        res.json({ success: true, message: "Cap nhat thanh cong", data: building });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/buildings/:id
exports.deleteBuilding = async (req, res) => {
    try {
        const { id } = req.params;
        const roomCount = await Room.countDocuments({ buildingId: id });
        if (roomCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Khong the xoa: toa nha con ${roomCount} phong`,
            });
        }

        await Building.findByIdAndDelete(id);
        res.json({ success: true, message: "Da xoa toa nha" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/buildings/:id/rooms
exports.getRoomsByBuilding = async (req, res) => {
    try {
        const rooms = await Room.find({ buildingId: req.params.id }).sort({ floor: 1, roomNumber: 1 });
        res.json({ success: true, data: rooms });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/buildings/:id/rooms
exports.createRoom = async (req, res) => {
    try {
        const { roomNumber, floor, type, maxOccupancy, pricePerTerm, status, amenities, description } = req.body;
        if (!roomNumber || !floor || !pricePerTerm) {
            return res.status(400).json({
                success: false,
                message: "roomNumber, floor, pricePerTerm la bat buoc",
            });
        }

        const normalizedRoomNumber = String(roomNumber).trim();
        const existing = await Room.findOne({
            buildingId: req.params.id,
            roomNumber: normalizedRoomNumber,
        });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "So phong da ton tai trong toa nha nay",
            });
        }

        const room = await Room.create({
            buildingId: req.params.id,
            roomNumber: normalizedRoomNumber,
            floor: Number(floor),
            type: type || "standard",
            maxOccupancy: Number(maxOccupancy) || 4,
            pricePerTerm: Number(pricePerTerm),
            status: status || "available",
            amenities: amenities || [],
            description,
        });

        res.status(201).json({ success: true, message: "Tao phong thanh cong", data: room });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/rooms/:id
exports.updateRoom = async (req, res) => {
    try {
        const { roomNumber, floor, type, maxOccupancy, pricePerTerm, status, amenities, description } = req.body;
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ success: false, message: "Khong tim thay phong" });
        }

        const normalizedRoomNumber = String(roomNumber || room.roomNumber).trim();
        if (!normalizedRoomNumber) {
            return res.status(400).json({ success: false, message: "roomNumber la bat buoc" });
        }

        if (maxOccupancy !== undefined && Number(maxOccupancy) < Number(room.currentOccupancy || 0)) {
            return res.status(400).json({
                success: false,
                message: "Suc chua moi khong duoc nho hon so nguoi dang o",
            });
        }

        const existing = await Room.findOne({
            _id: { $ne: room._id },
            buildingId: room.buildingId,
            roomNumber: normalizedRoomNumber,
        });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "So phong da ton tai trong toa nha nay",
            });
        }

        room.roomNumber = normalizedRoomNumber;
        if (floor !== undefined) room.floor = Number(floor);
        if (type !== undefined) room.type = type;
        if (maxOccupancy !== undefined) room.maxOccupancy = Number(maxOccupancy);
        if (pricePerTerm !== undefined) room.pricePerTerm = Number(pricePerTerm);
        if (status !== undefined) room.status = status;
        if (amenities !== undefined) room.amenities = amenities;
        if (description !== undefined) room.description = description;

        await room.save();

        res.json({ success: true, message: "Cap nhat phong thanh cong", data: room });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/rooms/:id
exports.deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ success: false, message: "Khong tim thay phong" });
        }
        if (room.currentOccupancy > 0) {
            return res.status(400).json({
                success: false,
                message: "Khong the xoa phong dang co nguoi o",
            });
        }

        await Room.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Da xoa phong" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
