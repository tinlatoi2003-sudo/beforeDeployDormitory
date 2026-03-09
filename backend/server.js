const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

app.use("/api/rooms", require("./src/routes/roomRoutes"));
app.use("/api/buildings", require("./src/routes/buildingRoutes"));
app.use("/api/room-assignments", require("./src/routes/roomAssignmentRoutes"));

app.use("/api/invoices", require("./src/routes/invoiceRoutes"));
app.use("/api/payments", require("./src/routes/paymentRoutes"));
app.use("/api/violation-records", require("./src/routes/violationRecordRoutes"));
app.use("/api/electricity-usages", require("./src/routes/electricityUsageRoutes"));
app.use("/api/reports", require("./src/routes/reportRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
