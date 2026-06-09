import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set request payload limits high enough to comfortably handle compressed image payloads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const DB_DIR = path.join(process.cwd(), 'src', 'data');
  const DB_PATH = path.join(DB_DIR, 'portfolio_db.json');

  // Ensure DB Directory exists on startup
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // API: Retrieve globally synchronized portfolio state
  app.get("/api/portfolio", (req, res) => {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        return res.json(JSON.parse(raw));
      }
      return res.json({ status: "none", message: "No server-side portfolio overrides found. Falling back to clean local defaults." });
    } catch (e: any) {
      console.error("Failed to read server portfolio persistence:", e);
      return res.status(500).json({ error: e.message || "Internal Server Error" });
    }
  });

  // API: Save globally synchronized portfolio state
  app.post("/api/portfolio", (req, res) => {
    try {
      const data = req.body;
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
      return res.json({ status: "success", message: "Portfolio successfully saved to server disk!" });
    } catch (e: any) {
      console.error("Failed to persist portfolio state sever-side:", e);
      return res.status(500).json({ error: e.message || "Internal Server Error" });
    }
  });

  // Hot Module Replacement (HMR) and development asset pipeline vs. Production Static pipeline
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
    console.log(`Server booting and running on http://localhost:${PORT}`);
  });
}

startServer();
