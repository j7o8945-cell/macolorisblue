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

  // API: Upload intro video as base64 to server disk
  app.post("/api/video/upload", (req, res) => {
    try {
      const { base64 } = req.body;
      if (!base64) {
        return res.status(400).json({ error: "No video body provided" });
      }

      // Convert base64 stream to raw binary
      const base64Data = base64.replace(/^data:video\/[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');

      const uploadDir = path.join(process.cwd(), 'src', 'data', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, 'intro.mp4');
      fs.writeFileSync(filePath, buffer);

      console.log("Intro video successfully written to server disk:", filePath);
      return res.json({ status: "success", url: "/api/video/intro.mp4" });
    } catch (e: any) {
      console.error("Failed to write video file server-side:", e);
      return res.status(500).json({ error: e.message || "Internal Server Error" });
    }
  });

  // API: Serve ALL video files (*.mp4, *.mov, *.webm, including intro.mp4 and defaults) with robust HTTP Range (Streaming) support for Safari/Mobile devices
  app.get(/\.(mp4|mov|webm)$/i, (req, res, next) => {
    // Decode URI path in case of any URL encoding
    const decodedPath = decodeURIComponent(req.path);
    
    // Check if it is the special upload route, redirect path respectively
    let filePath = '';
    if (decodedPath === '/api/video/intro.mp4') {
      filePath = path.join(process.cwd(), 'src', 'data', 'uploads', 'intro.mp4');
    } else {
      filePath = path.join(process.cwd(), decodedPath);
      if (!fs.existsSync(filePath)) {
        // In production, try looking inside the dist folder
        filePath = path.join(process.cwd(), 'dist', decodedPath);
      }
    }

    if (fs.existsSync(filePath)) {
      try {
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          const fileSize = stat.size;
          const range = req.headers.range;
          const contentType = decodedPath.endsWith('.webm') ? 'video/webm' :
                              (decodedPath.endsWith('.mov') || decodedPath.endsWith('.qt')) ? 'video/quicktime' :
                              'video/mp4';

          if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (start >= fileSize || end >= fileSize) {
              res.status(416).set('Content-Range', `bytes */${fileSize}`).set('Accept-Ranges', 'bytes').send();
              return;
            }

            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });
            const head = {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              'Content-Type': contentType,
            };

            res.writeHead(206, head);
            file.pipe(res);
          } else {
            const head = {
              'Content-Length': fileSize,
              'Content-Type': contentType,
              'Accept-Ranges': 'bytes',
            };
            res.writeHead(200, head);
            fs.createReadStream(filePath).pipe(res);
          }
          return;
        }
      } catch (err) {
        console.error("Video range stream failed:", err);
      }
    }
    next();
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
