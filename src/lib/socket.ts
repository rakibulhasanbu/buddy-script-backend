import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export const setIO = (socketServer: SocketIOServer): void => {
  io = socketServer;
};

export const getIO = (): SocketIOServer | null => io;

export const getUserRoom = (userId: string): string => `user:${userId}`;
