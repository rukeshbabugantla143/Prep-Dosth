import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import path from "path";
import cors from "cors";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Admin Client (using service_role key)
const supabaseUrl = "https://spvmldruoksncedppgop.supabase.co";
const supabaseServiceRole = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdm1sZHJ1b2tzbmNlZHBwZ29wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU4NzEyNSwiZXhwIjoyMDg5MTYzMTI1fQ.GbuoGlQ7OgHHhG-hQd8Wml0UWQ2MM85tfYT-6H2TEn0";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Ensure uploads directory exists
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configure Multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  const upload = multer({ storage });

  // API Route for file upload
  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    // Return the relative URL to the file
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Direct Password Reset API (Admin-level)
  app.post("/api/direct-reset", async (req, res) => {
    const { email, password } = req.body;
    console.log(`[AUTH] Direct reset request for: ${email}`);
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      // 1. Find the user ID by email
      console.log(`[AUTH] Searching for user...`);
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) throw listError;
      
      const user = users.find((u: any) => u.email?.toLowerCase() === (email as string).toLowerCase());
      
      if (!user) {
        console.warn(`[AUTH] User not found: ${email}`);
        return res.status(404).json({ error: "User not found" });
      }

      console.log(`[AUTH] Found user ${user.id}, updating password...`);

      // 2. Update the user password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: password }
      );

      if (updateError) throw updateError;

      console.log(`[AUTH] Success reset for ${email}`);
      res.json({ success: true, message: "Password updated successfully" });
    } catch (err: any) {
      console.error("[AUTH] Backend reset error:", err);
      res.status(500).json({ error: err.message || "An error occurred during password reset" });
    }
  });

  // Serve static files from public/uploads
  app.use("/uploads", express.static(uploadDir));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
