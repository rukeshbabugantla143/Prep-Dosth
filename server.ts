import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import multer from "multer";
import { fileURLToPath } from 'url';
import fs from 'fs';

import { initDB } from "./src/server/db.js";
import authRoutes from "./src/server/routes/auth.js";
import jobsRoutes from "./src/server/routes/jobs.js";
import examsRoutes from "./src/server/routes/exams.js";
import testsRoutes from "./src/server/routes/tests.js";
import homeRoutes from "./src/server/routes/home.js";
import notificationsRoutes from "./src/server/routes/notifications.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Configure Multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Serve static files from uploads folder
app.use('/uploads', express.static(uploadDir));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/exams", examsRoutes);
app.use("/api/tests", testsRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/notifications", notificationsRoutes);

// File upload route example
app.post("/api/upload", upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

async function startServer() {
  // Connect to MongoDB
  try {
    await initDB();
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
