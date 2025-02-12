import { users, assessments, assessmentRequests, type User, type InsertUser, type Assessment, type AssessmentRequest } from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  searchUsers(role: string, searchTerm: string): Promise<User[]>;
  createAssessment(assessment: Omit<Assessment, "id" | "completedAt">): Promise<Assessment>;
  getAssessments(leaderId: number): Promise<Assessment[]>;
  deleteAssessment(id: number): Promise<void>;
  createAssessmentRequest(leaderId: number, managerId: number): Promise<AssessmentRequest>;
  getManagerAssessmentRequests(managerId: number): Promise<(AssessmentRequest & { leader: User })[]>;
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

  async searchUsers(role: string, searchTerm: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, role as "admin" | "leader" | "manager"),
          ilike(users.name, `%${searchTerm}%`)
        )
      );
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

  async deleteAssessment(id: number): Promise<void> {
    await db
      .delete(assessments)
      .where(eq(assessments.id, id));
  }

  async createAssessmentRequest(leaderId: number, managerId: number): Promise<AssessmentRequest> {
    const [request] = await db
      .insert(assessmentRequests)
      .values({ leaderId, managerId })
      .returning();
    return request;
  }

  async getManagerAssessmentRequests(managerId: number): Promise<(AssessmentRequest & { leader: User })[]> {
    const results = await db
      .select({
        id: assessmentRequests.id,
        leaderId: assessmentRequests.leaderId,
        managerId: assessmentRequests.managerId,
        status: assessmentRequests.status,
        createdAt: assessmentRequests.createdAt,
        leader: users
      })
      .from(assessmentRequests)
      .where(eq(assessmentRequests.managerId, managerId))
      .leftJoin(users, eq(assessmentRequests.leaderId, users.id));

    return results.map(r => ({
      id: r.id,
      leaderId: r.leaderId,
      managerId: r.managerId,
      status: r.status,
      createdAt: r.createdAt,
      leader: r.leader!
    }));
  }

  async updateAssessmentRequestStatus(id: number, status: "completed"): Promise<void> {
    await db
      .update(assessmentRequests)
      .set({ status })
      .where(eq(assessmentRequests.id, id));
  }
}

export const storage = new DatabaseStorage();