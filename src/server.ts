import { createServer, Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import config from "./config";
import { setIO } from "@/lib/socket";
import { getUserRoom } from "@/lib/socket";
import { socketAuthMiddleware, SocketWithUser } from "@/middlewares/socket-auth";

async function bootstrap() {
  const server: Server = createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: config.clientUrl || "*",
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);
  io.on("connection", (socket: SocketWithUser) => {
    if (!socket.user) {
      socket.disconnect(true);
      return;
    }

    const userRoom = getUserRoom(socket.user.userId);
    socket.join(userRoom);
    console.log(`User connected to socket room: ${userRoom}`);

    socket.on("disconnect", () => {
      console.log(`User disconnected from socket room: ${userRoom}`);
    });
  });

  setIO(io);

  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.log("Server closed");
      });
    }
    process.exit(1);
  };

  const unexpectedErrorHandler = (error: unknown) => {
    console.log(error);
    exitHandler();
  };

  process.on("uncaughtException", unexpectedErrorHandler);
  process.on("unhandledRejection", unexpectedErrorHandler);

  process.on("SIGTERM", () => {
    console.log("SIGTERM received");
    if (server) {
      server.close();
    }
  });
}

bootstrap();
