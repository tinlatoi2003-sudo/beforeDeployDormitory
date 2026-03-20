const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
require("../models/Student");

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

const createPayment = async (req, res) => {
  try {
    const { invoiceId, studentId, amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (String(invoice.studentId) !== String(studentId)) {
      return res.status(400).json({ message: "Student does not match invoice" });
    }

    const remaining = Number(invoice.amount) - Number(invoice.paidAmount || 0);
    if (Number(amount) > remaining) {
      return res.status(400).json({ message: "Payment exceeds remaining invoice amount" });
    }

    const payment = new Payment(req.body);
    const savedPayment = await payment.save();

    invoice.paidAmount = Number(invoice.paidAmount || 0) + Number(amount);
    invoice.status = getComputedInvoiceStatus(invoice);
    await invoice.save();

    res.status(201).json(savedPayment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const { invoiceId, studentId, paymentMethod, fromDate, toDate } = req.query;
    const filter = {};

    if (invoiceId) filter.invoiceId = invoiceId;
    if (studentId) filter.studentId = studentId;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (fromDate || toDate) {
      filter.paidAt = {};
      if (fromDate) filter.paidAt.$gte = new Date(fromDate);
      if (toDate) filter.paidAt.$lte = new Date(toDate);
    }

    const payments = await Payment.find(filter)
      .populate("invoiceId", "invoiceCode amount paidAmount status")
      .populate("studentId", "studentCode fullName")
      .sort({ paidAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("invoiceId", "invoiceCode amount paidAmount status")
      .populate("studentId", "studentCode fullName");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const invoice = await Invoice.findById(payment.invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const allowedFields = ["amount", "paymentMethod", "transactionCode", "note", "paidAt"];
    const oldAmount = Number(payment.amount);

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        payment[field] = req.body[field];
      }
    }

    const newAmount = Number(payment.amount);
    if (newAmount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const delta = newAmount - oldAmount;
    const nextPaidAmount = Number(invoice.paidAmount || 0) + delta;

    if (nextPaidAmount < 0 || nextPaidAmount > Number(invoice.amount)) {
      return res.status(400).json({ message: "Updated payment makes invoice paidAmount invalid" });
    }

    await payment.save();

    invoice.paidAmount = nextPaidAmount;
    invoice.status = getComputedInvoiceStatus(invoice);
    await invoice.save();

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const invoice = await Invoice.findById(payment.invoiceId);
    if (invoice) {
      invoice.paidAmount = Math.max(0, Number(invoice.paidAmount || 0) - Number(payment.amount));
      invoice.status = getComputedInvoiceStatus(invoice);
      await invoice.save();
    }

    await Payment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
};
