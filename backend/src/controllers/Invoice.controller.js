const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");

const getComputedInvoiceStatus = ({ amount, paidAmount, dueDate }) => {
  const total = Number(amount || 0);
  const paid = Number(paidAmount || 0);

  if (paid >= total && total > 0) {
    return "paid";
  }

  const now = new Date();
  if (dueDate && new Date(dueDate) < now) {
    return paid > 0 ? "partial" : "overdue";
  }

  return paid > 0 ? "partial" : "unpaid";
};

const createInvoice = async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.paidAmount = Number(payload.paidAmount || 0);

    if (payload.amount !== undefined && payload.paidAmount > Number(payload.amount)) {
      return res.status(400).json({ message: "paidAmount cannot be greater than amount" });
    }

    payload.status = getComputedInvoiceStatus(payload);

    const invoice = new Invoice(payload);
    const savedInvoice = await invoice.save();
    res.status(201).json(savedInvoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllInvoices = async (req, res) => {
  try {
    const { status, type, studentId, roomId, termCode, overdueOnly } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (studentId) filter.studentId = studentId;
    if (roomId) filter.roomId = roomId;
    if (termCode) filter.termCode = termCode;
    if (overdueOnly === "true") {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $in: ["unpaid", "partial", "overdue"] };
    }

    const invoices = await Invoice.find(filter)
      .populate("studentId", "studentCode fullName")
      .populate("roomId", "roomNumber floor")
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("studentId", "studentCode fullName")
      .populate("roomId", "roomNumber floor")
      .populate("createdBy", "username email");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const allowedFields = [
      "invoiceCode",
      "studentId",
      "roomId",
      "type",
      "termCode",
      "description",
      "amount",
      "paidAmount",
      "dueDate",
      "relatedRequestId",
      "createdBy",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        invoice[field] = req.body[field];
      }
    }

    if (Number(invoice.paidAmount || 0) > Number(invoice.amount || 0)) {
      return res.status(400).json({ message: "paidAmount cannot be greater than amount" });
    }

    invoice.status = getComputedInvoiceStatus(invoice);

    const updatedInvoice = await invoice.save();
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["unpaid", "partial", "paid", "overdue"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    invoice.status = status;
    const updatedInvoice = await invoice.save();
    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const paymentCount = await Payment.countDocuments({ invoiceId: invoice._id });
    if (paymentCount > 0) {
      return res.status(400).json({ message: "Cannot delete invoice with existing payments" });
    }

    await Invoice.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
};
