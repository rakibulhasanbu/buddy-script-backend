import { z } from "zod";

const signupZodSchema = z.object({
  body: z.object({
    firstName: z.string({ required_error: "First name is required" }).min(1),
    lastName: z.string({ required_error: "Last name is required" }).min(1),
    email: z.string({ required_error: "Email is required" }).email(),
    password: z.string({ required_error: "Password is required" }).min(8),
  }),
});

const loginZodSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email(),
    password: z.string({ required_error: "Password is required" }),
  }),
});

const refreshTokenZodSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: "Refresh token is required" }),
  }),
});

const changePasswordZodSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email(),
    oldPassword: z.string({ required_error: "Old password is required" }),
    newPassword: z.string({ required_error: "New password is required" }).min(8),
  }),
});

export const AuthValidation = {
  signupZodSchema,
  loginZodSchema,
  refreshTokenZodSchema,
  changePasswordZodSchema,
};
