import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// User schema
export const insertUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().min(1, "Role is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}

// Role schema
export const insertRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
  color: z.string().default("primary"),
});

export type InsertRole = z.infer<typeof insertRoleSchema>;

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  color: string;
  userCount: number;
  createdAt: string;
}

// Permission types
export type Permission = 
  | 'dashboard:read'
  | 'users:read' | 'users:create' | 'users:update' | 'users:delete'
  | 'roles:read' | 'roles:create' | 'roles:update' | 'roles:delete'
  | 'reports:read' | 'reports:export'
  | 'settings:read' | 'settings:update'
  | 'billing:read' | 'billing:update';

// Activity log
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  timestamp: string;
}
