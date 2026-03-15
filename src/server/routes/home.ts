import express from "express";
import { HomeSection, HeroImage } from "../models.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get all home sections
router.get("/sections", async (req, res) => {
  try {
    const sections = await HomeSection.find().sort({ createdAt: 1 });
    res.json(sections.map(s => ({ ...s.toObject(), _id: s._id })));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sections" });
  }
});

// Create home section (Admin only)
router.post("/sections", authenticate, requireAdmin, async (req, res) => {
  try {
    const section = await HomeSection.create(req.body);
    res.status(201).json({ ...section.toObject(), _id: section._id });
  } catch (error) {
    res.status(400).json({ error: "Failed to create section" });
  }
});

// Update home section (Admin only)
router.put("/sections/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const section = await HomeSection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!section) return res.status(404).json({ error: "Section not found" });
    res.json({ ...section.toObject(), _id: section._id });
  } catch (error) {
    res.status(400).json({ error: "Failed to update section" });
  }
});

// Delete home section (Admin only)
router.delete("/sections/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const section = await HomeSection.findByIdAndDelete(req.params.id);
    if (!section) return res.status(404).json({ error: "Section not found" });
    res.json({ message: "Section deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete section" });
  }
});

// Get all hero images
router.get("/hero", async (req, res) => {
  try {
    const heroImages = await HeroImage.find().sort({ createdAt: 1 });
    res.json(heroImages.map(h => ({ ...h.toObject(), _id: h._id })));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch hero images" });
  }
});

// Create hero image (Admin only)
router.post("/hero", authenticate, requireAdmin, async (req, res) => {
  try {
    const heroImage = await HeroImage.create(req.body);
    res.status(201).json({ ...heroImage.toObject(), _id: heroImage._id });
  } catch (error) {
    res.status(400).json({ error: "Failed to create hero image" });
  }
});

// Update hero image (Admin only)
router.put("/hero/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const heroImage = await HeroImage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!heroImage) return res.status(404).json({ error: "Hero image not found" });
    res.json({ ...heroImage.toObject(), _id: heroImage._id });
  } catch (error) {
    res.status(400).json({ error: "Failed to update hero image" });
  }
});

// Delete hero image (Admin only)
router.delete("/hero/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const heroImage = await HeroImage.findByIdAndDelete(req.params.id);
    if (!heroImage) return res.status(404).json({ error: "Hero image not found" });
    res.json({ message: "Hero image deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete hero image" });
  }
});

export default router;
