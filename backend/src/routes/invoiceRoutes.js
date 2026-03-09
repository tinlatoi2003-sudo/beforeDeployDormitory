const express = require("express");
const router = express.Router();
const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
} = require("../controllers/Invoice.controller");

router.post("/", createInvoice);
router.get("/", getAllInvoices);
router.get("/:id", getInvoiceById);
router.put("/:id", updateInvoice);
router.patch("/:id/status", updateInvoiceStatus);
router.delete("/:id", deleteInvoice);

module.exports = router;
