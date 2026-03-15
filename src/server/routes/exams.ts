import express from "express";
import { Exam } from "../models.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get all exams
router.get("/", async (req, res) => {
  try {
    const exams = await Exam.find().sort({ date: 1 });
    res.json(exams.map(exam => ({ ...exam.toObject(), _id: exam._id })));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exams" });
  }
});

// Get single exam
router.get("/:id", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    res.json({ ...exam.toObject(), _id: exam._id });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exam" });
  }
});

// Create exam (Admin only)
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.create(req.body);
    res.status(201).json({ ...exam.toObject(), _id: exam._id });
  } catch (error) {
    res.status(400).json({ error: "Failed to create exam" });
  }
});

// Update exam (Admin only)
router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    res.json({ ...exam.toObject(), _id: exam._id });
  } catch (error) {
    res.status(400).json({ error: "Failed to update exam" });
  }
});

// Delete exam (Admin only)
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    res.json({ message: "Exam deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete exam" });
  }
});

export default router;
