import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertAssessmentSchema } from "@shared/schema";
import { z } from "zod";
import { ilike } from "drizzle-orm";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required")
});

const assessmentRequestSchema = z.object({
  leaderId: z.number(),
  managerId: z.number()
});

export function registerRoutes(app: Express): Server {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(data.email);

      if (!user || user.password !== data.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      return res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid email or password format",
          issues: error.errors.map(err => err.message)
        });
      }
      console.error('Login error:', error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(data.email);

      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser(data);
      return res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return res.status(400).json({ 
          message: "Validation failed", 
          issues 
        });
      }
      console.error('Registration error:', error);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/assessments", async (req: Request, res: Response) => {
    try {
      const data = insertAssessmentSchema.parse(req.body);
      const assessment = await storage.createAssessment(data);
      return res.json(assessment);
    } catch (error) {
      console.error('Assessment creation error:', error);
      return res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  app.get("/api/assessments/:leaderId", async (req: Request, res: Response) => {
    try {
      const leaderId = parseInt(req.params.leaderId);
      const assessments = await storage.getAssessments(leaderId);
      return res.json(assessments);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      return res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.post("/api/assessment-requests", async (req: Request, res: Response) => {
    try {
      const { leaderId, managerId } = assessmentRequestSchema.parse(req.body);
      const request = await storage.createAssessmentRequest(leaderId, managerId);
      return res.json(request);
    } catch (error) {
      console.error('Error creating assessment request:', error);
      return res.status(500).json({ message: "Failed to create assessment request" });
    }
  });

  app.get("/api/assessment-requests/manager", async (req: Request, res: Response) => {
    try {
      const managerId = req.query.managerId;
      if (!managerId) {
        return res.status(400).json({ message: "Manager ID is required" });
      }

      const requests = await storage.getManagerAssessmentRequests(Number(managerId));
      return res.json(requests);
    } catch (error) {
      console.error('Error fetching assessment requests:', error);
      return res.status(500).json({ message: "Failed to fetch assessment requests" });
    }
  });

  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const { role, search } = req.query;
      let users = await storage.searchUsers(role as string, search as string);

      // Remove sensitive information
      const sanitizedUsers = users.map(user => ({
        ...user,
        password: undefined
      }));

      return res.json(sanitizedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/auth/user", async (req: Request, res: Response) => {
    // This would normally check session/token
    // For now, return a mock authenticated user
    return res.json({ 
      user: {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        role: "leader",
        project: "Demo Project"
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}