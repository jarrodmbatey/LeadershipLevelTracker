import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "leader", "manager"] }).notNull(),
  name: text("name").notNull()
});

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  leaderId: integer("leader_id").notNull(),
  managerId: integer("manager_id").notNull(),
  category: text("category", { enum: ["positional", "permission", "production"] }).notNull(),
  questionId: integer("question_id").notNull(),
  leaderScore: integer("leader_score"),
  managerScore: integer("manager_score"),
  completedAt: timestamp("completed_at")
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
  name: true
});

export const insertAssessmentSchema = createInsertSchema(assessments).pick({
  leaderId: true,
  managerId: true,
  category: true,
  questionId: true,
  leaderScore: true,
  managerScore: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

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