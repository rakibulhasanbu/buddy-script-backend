import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import config from "@/config";

const pool = new Pool({ connectionString: config.database_url });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export default prisma;
