import bcrypt from "bcrypt";
import config from "@/config";

export const createBcryptPassword = async (password: string): Promise<string> => {
  const bcryptPass = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

  return bcryptPass;
};
