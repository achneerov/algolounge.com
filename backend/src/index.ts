import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

import authRoutes from "./routes/auth";
import favoritesRoutes from "./routes/favorites";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

// Middleware
app.use(express.json());

// CORS configuration
const corsOptions =
  NODE_ENV === "production"
    ? {
        origin: process.env.CORS_ORIGIN || "http://localhost:4200",
        credentials: true,
      }
    : {
        origin: "*",
        credentials: false,
      };

app.use(cors(corsOptions));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoritesRoutes);

// Serve static files from built Angular app (production)
if (NODE_ENV === "production") {
  const publicPath = path.join(__dirname, "../public");
  app.use(express.static(publicPath));

  // Serve index.html for all routes (SPA)
  app.use((req: Request, res: Response) => {
    const indexPath = path.join(publicPath, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(404).send("Not found");
      }
    });
  });
}

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", environment: NODE_ENV });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${NODE_ENV} mode)`);
});
