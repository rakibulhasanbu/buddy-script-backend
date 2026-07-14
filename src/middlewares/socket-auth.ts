import { Socket } from "socket.io";
import { Secret } from "jsonwebtoken";
import config from "@/config";
import { jwtHelpers } from "@/utils/jwt";

export type SocketWithUser = Socket & {
  user?: {
    userId: string;
    role: string;
    email: string;
  };
};

export const socketAuthMiddleware = (socket: SocketWithUser, next: (_err?: Error) => void): void => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error("Authentication token is required"));
    }

    const verifiedUser = jwtHelpers.verifyToken(token, config.jwt.secret as Secret);
    socket.user = {
      userId: verifiedUser.userId as string,
      role: verifiedUser.role as string,
      email: verifiedUser.email as string,
    };

    next();
  } catch {
    next(new Error("Invalid authentication token"));
  }
};
