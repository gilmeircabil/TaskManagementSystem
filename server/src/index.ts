import express, { Express, Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { connectDB } from "./config/db";
import taskRoutes from "./routes/taskRoutes";
import { registerSocketHandlers } from "./socket";

dotenv.config();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app: Express = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

// Make io available to route controllers via req.app.get("io")
app.set("io", io);

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/tasks", taskRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[error]", err);
  res.status(500).json({ message: "Internal server error" });
});

registerSocketHandlers(io);

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`[server] listening on port ${PORT}`);
    console.log(`[server] accepting client origin: ${CLIENT_URL}`);
  });
};

start();
