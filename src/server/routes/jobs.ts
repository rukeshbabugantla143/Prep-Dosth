import express from "express";
import { Job } from "../models.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs.map(job => ({ ...job.toObject(), _id: job._id })));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// Get single job
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ ...job.toObject(), _id: job._id });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

// Create job (Admin only)
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json({ ...job.toObject(), _id: job._id });
  } catch (error) {
    res.status(400).json({ error: "Failed to create job" });
  }
});

// Update job (Admin only)
router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ ...job.toObject(), _id: job._id });
  } catch (error) {
    res.status(400).json({ error: "Failed to update job" });
  }
});

// Delete job (Admin only)
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete job" });
  }
});

export default router;
