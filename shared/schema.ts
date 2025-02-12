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
  // Section 1: Position
  { id: 1, category: "position", text: "I am respected because of my leadership title." },
  { id: 2, category: "position", text: "I ensure that my team understands my role and responsibilities." },
  { id: 3, category: "position", text: "I consistently enforce organizational policies and standards." },
  { id: 4, category: "position", text: "My team follows my instructions even when they don't personally agree." },
  { id: 5, category: "position", text: "I use my authority to provide structure and order." },
  { id: 6, category: "position", text: "I maintain a professional demeanor in all leadership situations." },
  { id: 7, category: "position", text: "I clearly define expectations for those I lead." },
  { id: 8, category: "position", text: "I take responsibility for the success or failure of my team." },
  { id: 9, category: "position", text: "I am willing to do the work I ask my team to do." },
  { id: 10, category: "position", text: "I believe that leadership is about responsibility, not just a position." },

  // Section 2: Permission
  { id: 11, category: "permission", text: "My team members feel comfortable approaching me with their concerns." },
  { id: 12, category: "permission", text: "I actively listen to understand my team members' needs and challenges." },
  { id: 13, category: "permission", text: "I build personal connections with my team that go beyond work-related matters." },
  { id: 14, category: "permission", text: "I show appreciation for my team's efforts and contributions." },
  { id: 15, category: "permission", text: "I encourage open communication and feedback within my team." },
  { id: 16, category: "permission", text: "I invest time in understanding what motivates each team member." },
  { id: 17, category: "permission", text: "I handle conflicts in a way that strengthens relationships." },
  { id: 18, category: "permission", text: "My team members know that I genuinely care about them." },
  { id: 19, category: "permission", text: "I adapt my leadership style based on the personalities of my team members." },
  { id: 20, category: "permission", text: "I foster a positive and inclusive team environment." },

  // Section 3: Production
  { id: 21, category: "production", text: "I set clear and measurable goals for my team." },
  { id: 22, category: "production", text: "I lead by example in terms of work ethic and discipline." },
  { id: 23, category: "production", text: "My team consistently meets or exceeds performance expectations." },
  { id: 24, category: "production", text: "I identify and address inefficiencies in our performance." },
  { id: 25, category: "production", text: "I take initiative to improve team performance." },
  { id: 26, category: "production", text: "I encourage innovation and creative problem-solving within my team." },
  { id: 27, category: "production", text: "I am able to delegate tasks effectively." },
  { id: 28, category: "production", text: "I track and evaluate progress toward team goals." },
  { id: 29, category: "production", text: "I make tough decisions when necessary to achieve success." },
  { id: 30, category: "production", text: "My leadership positively impacts the organization's bottom line." },

  // Section 4: People Development
  { id: 31, category: "people", text: "I actively mentor and develop future leaders within my team." },
  { id: 32, category: "people", text: "I provide constructive feedback to help my team grow." },
  { id: 33, category: "people", text: "I encourage my team members to pursue personal and professional development." },
  { id: 34, category: "people", text: "I help my team identify and leverage their strengths." },
  { id: 35, category: "people", text: "I create opportunities for my team members to take on new challenges." },
  { id: 36, category: "people", text: "I support my team in setting and achieving their career goals." },
  { id: 37, category: "people", text: "I invest time in training and developing my team's skills." },
  { id: 38, category: "people", text: "I recognize and reward leadership potential within my team." },
  { id: 39, category: "people", text: "I am willing to step aside to allow others to lead when appropriate." },
  { id: 40, category: "people", text: "I am focused on building a legacy of strong leaders, not just achieving short-term results." },

  // Section 5: Pinnacle
  { id: 41, category: "pinnacle", text: "My leadership extends beyond my immediate team and influences the organization." },
  { id: 42, category: "pinnacle", text: "People seek my guidance even when they are not required to follow me." },
  { id: 43, category: "pinnacle", text: "I am known for developing leaders who go on to lead successfully." },
  { id: 44, category: "pinnacle", text: "I make leadership decisions based on long-term impact, not just short-term gains." },
  { id: 45, category: "pinnacle", text: "I am intentional about leaving a lasting legacy of leadership excellence." },
  { id: 46, category: "pinnacle", text: "I help create a culture where leadership is a priority." },
  { id: 47, category: "pinnacle", text: "I am recognized as a leader beyond my organization (e.g., industry, community)." },
  { id: 48, category: "pinnacle", text: "My leadership inspires others to become better leaders themselves." },
  { id: 49, category: "pinnacle", text: "I consistently uphold the highest ethical standards." },
  { id: 50, category: "pinnacle", text: "If I left my leadership role today, my impact would still be felt." }
] as const;