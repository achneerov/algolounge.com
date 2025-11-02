import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { users } from "./models/users";
import { favoriteCourses, favoriteCourseUnique } from "./models/favorite-courses";
import path from "path";

const dbPath = path.join(__dirname, "../../database.db");

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

const schema = { users, favoriteCourses, favoriteCourseUnique };

export const db = drizzle(sqlite, { schema });

// Re-export all models
export { users, favoriteCourses, favoriteCourseUnique };
