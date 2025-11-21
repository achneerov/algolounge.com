import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const userRoles = sqliteTable("user_roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roleName: text("role_name").notNull().unique(),
});
