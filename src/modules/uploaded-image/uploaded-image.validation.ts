import { z } from "zod";

const createValidation = z.object({
  body: z.object({}),
});
const updateValidation = z.object({
  body: z.object({}),
});
const deleteValidation = z.object({
  body: z.array(z.string()).min(1),
});
export const UploadedImageValidation = {
  createValidation,
  updateValidation,
  deleteValidation,
};
