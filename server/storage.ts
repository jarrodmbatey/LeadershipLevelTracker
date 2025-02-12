import { users, assessments, assessmentRequests, type User, type InsertUser, type Assessment, type AssessmentRequest } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  createAssessment(assessment: Omit<Assessment, "id" | "completedAt">): Promise<Assessment>;
  getAssessments(leaderId: number): Promise<Assessment[]>;
  createAssessmentRequest(leaderId: number): Promise<AssessmentRequest>;
  getPendingAssessmentRequests(): Promise<AssessmentRequest[]>;
  updateAssessmentRequestStatus(id: number, status: "completed"): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createAssessment(assessment: Omit<Assessment, "id" | "completedAt">): Promise<Assessment> {
    const [result] = await db
      .insert(assessments)
      .values(assessment)
      .returning();
    return result;
  }

  async getAssessments(leaderId: number): Promise<Assessment[]> {
    return await db
      .select()
      .from(assessments)
      .where(eq(assessments.leaderId, leaderId));
  }

  async createAssessmentRequest(leaderId: number): Promise<AssessmentRequest> {
    const [request] = await db
      .insert(assessmentRequests)
      .values({ leaderId })
      .returning();
    return request;
  }

  async getPendingAssessmentRequests(): Promise<AssessmentRequest[]> {
    return await db
      .select()
      .from(assessmentRequests)
      .where(eq(assessmentRequests.status, "pending"));
  }

  async updateAssessmentRequestStatus(id: number, status: "completed"): Promise<void> {
    await db
      .update(assessmentRequests)
      .set({ status })
      .where(eq(assessmentRequests.id, id));
  }
}

export const storage = new DatabaseStorage();