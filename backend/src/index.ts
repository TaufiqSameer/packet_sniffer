import express from "express";
import cors from "cors";
import http from "http";
import { Server as IOServer } from "socket.io";
import { createPacketRouter } from "./routes/packets";
import { createExportRouter } from "./routes/export";

const app = express();
const server = http.createServer(app);

const io = new IOServer(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json({ limit: "5mb" }));

// Routes
app.use("/api", createPacketRouter(io));
app.use("/api/export", createExportRouter());

io.on("connection", (socket) => {
  console.log(`[ws] client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[ws] client disconnected: ${socket.id}`);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(` Backend running at http://localhost:${PORT}`);
  console.log(`Socket.IO ready`);
});