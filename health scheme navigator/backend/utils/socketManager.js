import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;
const userSockets = new Map(); // Map userId -> socketId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Or specific frontend URL
      methods: ["GET", "POST"]
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
    if (!token) {
      return next(new Error("Authentication error"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "schemesathi_secret_key_2026");
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.id} (Socket: ${socket.id})`);
    
    // Store mapping
    userSockets.set(socket.user.id, socket.id);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.id}`);
      userSockets.delete(socket.user.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const getSocketId = (userId) => {
  return userSockets.get(userId.toString());
};
