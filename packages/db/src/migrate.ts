import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const DATABASE_URL = process.env.DATABASE_URL ?? "./clarity.db";

const sqlite = new Database(DATABASE_URL);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "./migrations" });

console.log("Migrations applied successfully");
sqlite.close();
