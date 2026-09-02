import { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "../types";

interface OnlineUser {
  socketId: string;
  name: string;
}

// In-memory presence map (fine for a single-instance demo app;
// swap for a shared store like Redis if scaling to multiple server instances)
const onlineUsers = new Map<string, OnlineUser>();

const broadcastPresence = (io: Server) => {
  io.emit(SOCKET_EVENTS.PRESENCE_UPDATE, Array.from(onlineUsers.values()));
};

export const registerSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    socket.on("presence:join", (name: string) => {
      onlineUsers.set(socket.id, { socketId: socket.id, name: name || "Anonymous" });
      broadcastPresence(io);
    });

    socket.on(SOCKET_EVENTS.USER_TYPING, (payload: { taskId: string; name: string }) => {
      socket.broadcast.emit(SOCKET_EVENTS.USER_TYPING, payload);
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.id);
      broadcastPresence(io);
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });
};
