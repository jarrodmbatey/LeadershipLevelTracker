import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
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

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  leaderId: integer("leader_id").notNull().references(() => users.id),
  managerId: integer("manager_id").references(() => users.id),
  questionId: integer("question_id").notNull(),
  leaderScore: integer("leader_score"),
  managerScore: integer("manager_score"),
  completedAt: timestamp("completed_at").defaultNow()
});

export const assessmentRequests = pgTable("assessment_requests", {
  id: serial("id").primaryKey(),
  leaderId: integer("leader_id").notNull().references(() => users.id),
  managerId: integer("manager_id").references(() => users.id), 
  status: text("status", { enum: ["pending", "completed"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
  name: true,
  project: true
});

export const insertAssessmentSchema = createInsertSchema(assessments).pick({
  leaderId: true,
  managerId: true,
  questionId: true,
  leaderScore: true,
  managerScore: true
});

export const insertAssessmentRequestSchema = createInsertSchema(assessmentRequests).pick({
  leaderId: true,
  managerId: true,
  status: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type AssessmentRequest = typeof assessmentRequests.$inferSelect;

// Sample questions for the assessment
export const questions = [
  // Positional Leadership (Title-Based Leadership)
  { id: 1, category: "positional", text: "I clearly understand my responsibilities as a leader." },
  { id: 2, category: "positional", text: "I consistently communicate expectations to my team." },
  { id: 3, category: "positional", text: "My team follows my directions because of my position." },
  { id: 4, category: "positional", text: "I make decisions confidently within my role's authority." },
  { id: 5, category: "positional", text: "I enforce company policies fairly and consistently." },
  { id: 6, category: "positional", text: "I take responsibility for both successes and failures in my team." },
  { id: 7, category: "positional", text: "My team respects my authority as their leader." },
  { id: 8, category: "positional", text: "I am proactive in solving problems rather than waiting for direction." },
  { id: 9, category: "positional", text: "I stay updated on policies, procedures, and industry trends relevant to my role." },
  { id: 10, category: "positional", text: "I demonstrate professionalism and set the tone for workplace culture." },

  // Permission Leadership (Relationship-Based Leadership)
  { id: 11, category: "permission", text: "I build strong relationships with my team members." },
  { id: 12, category: "permission", text: "I actively listen to my team's concerns and feedback." },
  { id: 13, category: "permission", text: "My team feels comfortable approaching me with problems." },
  { id: 14, category: "permission", text: "I show appreciation for my team's efforts and contributions." },
  { id: 15, category: "permission", text: "I am approachable and open to different perspectives." },
  { id: 16, category: "permission", text: "I foster an environment of mutual trust and respect." },
  { id: 17, category: "permission", text: "I mentor and coach my team members for professional growth." },
  { id: 18, category: "permission", text: "I make an effort to understand the personal motivations of my team." },
  { id: 19, category: "permission", text: "I resolve conflicts fairly and constructively." },
  { id: 20, category: "permission", text: "I support work-life balance and employee well-being." },

  // Production Leadership (Results-Oriented Leadership)
  { id: 21, category: "production", text: "I set clear and measurable goals for my team." },
  { id: 22, category: "production", text: "My team consistently meets or exceeds performance expectations." },
  { id: 23, category: "production", text: "I lead by example through my own productivity and work ethic." },
  { id: 24, category: "production", text: "I hold my team accountable for results." },
  { id: 25, category: "production", text: "I recognize and reward high performance." },
  { id: 26, category: "production", text: "I effectively delegate tasks to optimize team performance." },
  { id: 27, category: "production", text: "I make data-driven decisions to improve performance." },
  { id: 28, category: "production", text: "I encourage continuous improvement and innovation." },
  { id: 29, category: "production", text: "I address underperformance quickly and effectively." },
  { id: 30, category: "production", text: "My team understands how their work contributes to organizational success." },
  { id: 31, category: "production", text: "I provide constructive feedback to help my team grow." },
  { id: 32, category: "production", text: "I adapt leadership strategies based on team needs." },
  { id: 33, category: "production", text: "I create an environment that motivates people to give their best effort." },
  { id: 34, category: "production", text: "I promote teamwork and collaboration to achieve goals." },
  { id: 35, category: "production", text: "I manage time and priorities efficiently." },
  { id: 36, category: "production", text: "I effectively balance short-term goals with long-term vision." },
  { id: 37, category: "production", text: "I encourage my team to take initiative." },
  { id: 38, category: "production", text: "I take decisive action when necessary." },
  { id: 39, category: "production", text: "I demonstrate resilience in challenging situations." },
  { id: 40, category: "production", text: "I continuously seek personal development and leadership growth." }
] as const;