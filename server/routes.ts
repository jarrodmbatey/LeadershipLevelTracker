import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
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
        return res.status(400).json({ message: "Invalid email or password format" });
      }
      return res.status(400).json({ message: "Invalid request" });
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
      return res.status(400).json({ message: "Registration failed" });
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

  // New endpoint to get all users (admin only)
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      // TODO: Replace with actual session check
      const users = await storage.getAllUsers();

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

  const httpServer = createServer(app);
  return httpServer;
}