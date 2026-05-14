import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:5000";

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

socket.on("connect", () => console.log("[socket] connected:", socket.id));
socket.on("disconnect", () => console.log("[socket] disconnected"));
socket.on("connect_error", (err) => console.warn("[socket] error:", err.message));
