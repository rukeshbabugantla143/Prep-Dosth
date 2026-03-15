import express from "express";
import { MockTest } from "../models.js";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth.js";

const router = express.Router();

// Get all tests
router.get("/", async (req, res) => {
  try {
    const tests = await MockTest.find().sort({ createdAt: -1 });
    res.json(tests.map(test => ({ ...test.toObject(), _id: test._id })));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tests" });
  }
});

// Get single test
router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const test = await MockTest.findById(req.params.id);
    if (!test) return res.status(404).json({ error: "Test not found" });
    
    const testObj = test.toObject();
    
    // If user is not admin, hide correct answers
    if (req.user?.role !== "admin") {
      testObj.questions = testObj.questions.map((q: any) => {
        const { correctAnswer, ...rest } = q;
        return rest;
      });
    }
    
    res.json({ ...testObj, _id: test._id });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch test" });
  }
});

// Submit test
router.post("/:id/submit", authenticate, async (req, res) => {
  try {
    const { answers } = req.body; // { questionId: answer }
    const test = await MockTest.findById(req.params.id);
    if (!test) return res.status(404).json({ error: "Test not found" });

    let score = 0;
    const totalQuestions = test.questions.length;
    const marksPerQuestion = test.marks / totalQuestions;

    test.questions.forEach((q: any) => {
      // Assuming q._id is used as questionId in answers
      if (answers[q._id] === q.correctAnswer) {
        score += marksPerQuestion;
      }
    });

    res.json({ score, totalMarks: test.marks, totalQuestions });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit test" });
  }
});

// Create test (Admin only)
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const test = await MockTest.create(req.body);
    res.status(201).json({ ...test.toObject(), _id: test._id });
  } catch (error) {
    res.status(400).json({ error: "Failed to create test" });
  }
});

// Update test (Admin only)
router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const test = await MockTest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!test) return res.status(404).json({ error: "Test not found" });
    res.json({ ...test.toObject(), _id: test._id });
  } catch (error) {
    res.status(400).json({ error: "Failed to update test" });
  }
});

// Delete test (Admin only)
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const test = await MockTest.findByIdAndDelete(req.params.id);
    if (!test) return res.status(404).json({ error: "Test not found" });
    res.json({ message: "Test deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete test" });
  }
});

export default router;
