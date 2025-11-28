import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

import authRoutes from "./routes/auth";
import favoritesRoutes from "./routes/favorites";
import questionCompletionsRoutes from "./routes/question-completions";
import quizTemplatesRoutes from "./routes/quiz-templates";
import quizEventsRoutes from "./routes/quiz-events";
import voiceRoutes from "./routes/voice";
import { MediasoupService } from "./services/mediasoup.service";
import { voiceService } from "./services/voice.service";
import { verifyToken } from "./services/auth";

console.log("[SERVER] Starting backend server...");

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
app.use("/api/question-completions", questionCompletionsRoutes);
app.use("/api/quiz-templates", quizTemplatesRoutes);
app.use("/api/quiz-events", quizEventsRoutes);
app.use("/api/voice", voiceRoutes);

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
const httpServer = createServer(app);

// Setup Socket.io for WebRTC signaling
const io = new SocketIOServer(httpServer, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

console.log("[SOCKET.IO] Created Socket.io server");

// Track voice connections per session and user
interface VoiceConnection {
  socket: any;
  userId: number;
  sessionId: number;
  producerIds: string[];
  consumerIds: string[];
}

const voiceConnections = new Map<string, VoiceConnection>(); // key: `${sessionId}-${userId}`
const sessionConnections = new Map<number, Map<number, VoiceConnection>>(); // sessionId -> userId -> connection

// Voice namespace for WebRTC signaling
console.log("[SOCKET.IO] Creating /voice namespace");
const voiceNamespace = io.of("/voice");
console.log("[SOCKET.IO] /voice namespace created");

// Socket.io authentication middleware - MUST be on the voice namespace
console.log("[SOCKET.IO] Registering auth middleware on /voice namespace...");
voiceNamespace.use((socket, next) => {
  console.log("[AUTH] Auth middleware called");
  const token = socket.handshake.auth.token;
  console.log("[AUTH] Socket.io auth attempt - token present:", !!token);
  if (!token) {
    console.error("[AUTH] No auth token provided");
    return next(new Error("Authentication token required"));
  }

  try {
    console.log("[AUTH] Verifying token...");
    const payload = verifyToken(token);
    console.log("[AUTH] Token verification result:", payload);
    if (!payload) {
      console.error("[AUTH] Token payload is null/undefined");
      return next(new Error("Invalid token"));
    }
    console.log("[AUTH] Token payload:", payload);
    console.log("[AUTH] Setting userId to:", payload.userId);
    (socket as any).userId = payload.userId;
    next();
  } catch (error) {
    console.error("[AUTH] Token verification error:", error);
    next(new Error("Invalid token"));
  }
});
console.log("[SOCKET.IO] Auth middleware registered on /voice namespace");

voiceNamespace.on("connection", (socket) => {
  const userId = (socket as any).userId;
  console.log(`User ${userId} connected to voice namespace: ${socket.id}`);

  if (!userId) {
    socket.disconnect();
    return;
  }

  // User joins a voice session
  socket.on("join", async (data: { sessionId: number }, callback) => {
    try {
      const { sessionId } = data;
      console.log(`[JOIN] User ${userId} joining session ${sessionId}`);

      // Verify session exists and is active
      const session = await voiceService.getSession(sessionId);
      console.log(`[JOIN] Session lookup result:`, session);
      if (!session || session.status !== "active") {
        console.log(`[JOIN] Invalid or closed session`);
        return callback({ error: "Invalid or closed session" });
      }

      // Check participant limit
      const participantCount = await voiceService.getParticipantCount(sessionId);
      console.log(`[JOIN] Participant count:`, participantCount);
      if (participantCount >= (session.maxParticipants || 20)) {
        console.log(`[JOIN] Session is full`);
        return callback({ error: "Session is full" });
      }

      // Add participant to database
      console.log(`[JOIN] Adding participant to database`);
      await voiceService.addParticipant(sessionId, userId);

      // Create or get router for this session
      console.log(`[JOIN] Creating/getting router for session`);
      const mediasoupService = MediasoupService.getInstance();
      const router = await mediasoupService.createRouter(sessionId);

      // Get RTP capabilities
      const rtpCapabilities = router.rtpCapabilities;
      console.log(`[JOIN] Got RTP capabilities`);

      // Setup connection tracking
      const connectionKey = `${sessionId}-${userId}`;
      const connection: VoiceConnection = {
        socket,
        userId,
        sessionId,
        producerIds: [],
        consumerIds: [],
      };
      voiceConnections.set(connectionKey, connection);

      if (!sessionConnections.has(sessionId)) {
        sessionConnections.set(sessionId, new Map());
      }
      sessionConnections.get(sessionId)!.set(userId, connection);

      // Join room for this session
      socket.join(`voice-session-${sessionId}`);
      console.log(`[JOIN] User joined room`);

      // Send back RTP capabilities and existing participants
      const participants = await voiceService.getParticipants(sessionId);
      console.log(`[JOIN] Calling callback with participants:`, participants.length);
      callback({
        success: true,
        rtpCapabilities,
        participants: participants.map((p) => ({
          ...p,
          isCurrentUser: p.userId === userId,
        })),
      });
      console.log(`[JOIN] Callback completed`);

      // Notify other participants that new user joined
      socket.to(`voice-session-${sessionId}`).emit("user_joined", {
        userId,
        participantCount: participantCount + 1,
      });
    } catch (error) {
      console.error("Join error:", error);
      console.error("Error stack:", (error as any).stack);
      callback({ error: "Failed to join session" });
    }
  });

  // Handle transport creation
  socket.on(
    "create-send-transport",
    async (data: { sessionId: number }, callback) => {
      try {
        const { sessionId } = data;
        const mediasoupService = MediasoupService.getInstance();
        const router = mediasoupService.getRouter(sessionId);

        if (!router) {
          return callback({ error: "Router not found" });
        }

        const transport = await router.createWebRtcTransport({
          listenIps: [{ ip: "127.0.0.1", announcedIp: undefined }],
          enableUdp: true,
          enableTcp: true,
          preferUdp: true,
        });

        const connectionKey = `${sessionId}-${userId}`;
        const connection = voiceConnections.get(connectionKey);
        if (connection) {
          (connection as any).sendTransport = transport;
        }

        callback({
          success: true,
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          },
        });
      } catch (error) {
        console.error("Create send transport error:", error);
        callback({ error: "Failed to create transport" });
      }
    }
  );

  // Handle send transport connect
  socket.on(
    "connect-send-transport",
    async (
      data: {
        sessionId: number;
        dtlsParameters: any;
      },
      callback
    ) => {
      try {
        const { sessionId, dtlsParameters } = data;
        const connectionKey = `${sessionId}-${userId}`;
        const connection = voiceConnections.get(connectionKey);

        if (!connection || !(connection as any).sendTransport) {
          return callback({ error: "Transport not found" });
        }

        await (connection as any).sendTransport.connect({ dtlsParameters });
        callback({ success: true });
      } catch (error) {
        console.error("Connect send transport error:", error);
        callback({ error: "Failed to connect transport" });
      }
    }
  );

  // Handle produce (send media)
  socket.on(
    "produce",
    async (
      data: {
        sessionId: number;
        kind: "audio" | "video";
        rtpParameters: any;
      },
      callback
    ) => {
      try {
        const { sessionId, kind, rtpParameters } = data;
        const connectionKey = `${sessionId}-${userId}`;
        const connection = voiceConnections.get(connectionKey);

        if (!connection || !(connection as any).sendTransport) {
          return callback({ error: "Transport not found" });
        }

        const producer = await (connection as any).sendTransport.produce({
          kind,
          rtpParameters,
        });

        connection.producerIds.push(producer.id);

        callback({ success: true, id: producer.id });

        // Notify others to consume this producer
        socket.to(`voice-session-${sessionId}`).emit("producer_added", {
          producerId: producer.id,
          userId,
          kind,
        });
      } catch (error) {
        console.error("Produce error:", error);
        callback({ error: "Failed to produce" });
      }
    }
  );

  // Handle mute/unmute
  socket.on(
    "mute",
    async (data: { sessionId: number; isMuted: boolean }, callback) => {
      try {
        const { sessionId, isMuted } = data;
        await voiceService.updateMuteStatus(sessionId, userId, isMuted);

        socket.to(`voice-session-${sessionId}`).emit("user_muted", {
          userId,
          isMuted,
        });

        callback({ success: true });
      } catch (error) {
        console.error("Mute error:", error);
        callback({ error: "Failed to update mute status" });
      }
    }
  );

  // Handle video toggle
  socket.on(
    "toggle-video",
    async (data: { sessionId: number; isVideoEnabled: boolean }, callback) => {
      try {
        const { sessionId, isVideoEnabled } = data;
        await voiceService.updateVideoStatus(sessionId, userId, isVideoEnabled);

        socket.to(`voice-session-${sessionId}`).emit("user_video_toggled", {
          userId,
          isVideoEnabled,
        });

        callback({ success: true });
      } catch (error) {
        console.error("Toggle video error:", error);
        callback({ error: "Failed to toggle video" });
      }
    }
  );

  // Handle disconnect
  socket.on("disconnect", async () => {
    console.log(`User ${userId} disconnected from voice namespace`);

    // Find and clean up all voice connections for this user
    for (const [key, connection] of voiceConnections.entries()) {
      if (connection.userId === userId) {
        const { sessionId } = connection;

        // Remove from database
        await voiceService.removeParticipant(sessionId, userId);

        // Notify others
        const voiceNamespace = io.of("/voice");
        voiceNamespace.to(`voice-session-${sessionId}`).emit("user_left", {
          userId,
        });

        voiceConnections.delete(key);

        // Clean up session if no more participants
        const participants = await voiceService.getParticipants(sessionId);
        if (participants.length === 0) {
          mediasoupService.closeRouter(sessionId);
        }
      }
    }
  });
});

// Initialize mediasoup and start server
const mediasoupService = MediasoupService.getInstance();

async function startServer() {
  try {
    await mediasoupService.initialize();

    httpServer.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT} (${NODE_ENV} mode) with Socket.io enabled`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
