import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "leader", "manager"] }).notNull(),
  name: text("name").notNull(),
  project: text("project").notNull(),
  createdAt: timestamp("created_at").defaultNow()  
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
  name: true,
  project: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;


// Sample questions for the assessment
export const questions = [
  {
    id: 1,
    category: "positional",
    text: "I clearly understand my responsibilities as a leader."
  },
  {
    id: 2,
    category: "positional",
    text: "I consistently communicate expectations to my team."
  },
  {
    id: 3,
    category: "permission",
    text: "I build strong relationships with my team members."
  }
] as const;