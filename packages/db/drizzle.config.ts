import { defineConfig } from "drizzle-kit";
import path from "path";

const projectRoot = path.resolve(process.cwd(), "..", "..");
const dbUrl = process.env.DATABASE_URL ?? path.resolve(projectRoot, "clarity.db");

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: dbUrl,
  },
});
