import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const questionTypes = sqliteTable("question_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  typeName: text("type_name").notNull().unique(),
});
