import { sql } from 'drizzle-orm';
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users-table', {
  id: int().primaryKey({ autoIncrement: true }),
  username: text().unique().notNull(),
});

export const todosTable = sqliteTable('todos-table', {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  body: text().notNull(),
  status: text({ enum: ['inprogress', 'completed'] }).default('inprogress'),
  createdAt: text().default(sql`(CURRENT_TIMESTAMP)`),
});
