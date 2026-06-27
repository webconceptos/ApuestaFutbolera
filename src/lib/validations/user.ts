import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
  email: z.email("Email inválido").toLowerCase(),
  username: z.string().trim().max(30).optional().or(z.literal("")),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  role: z.enum(["USER", "TOURNAMENT_MANAGER", "SUPERADMIN"]),
  sendWelcomeEmail: z.boolean().default(true),
  markVerified: z.boolean().default(true),
  internalNote: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  username: z.string().trim().max(30).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  bio: z.string().trim().max(160).optional().or(z.literal("")),
  role: z.enum(["USER", "TOURNAMENT_MANAGER", "SUPERADMIN"]),
  internalNote: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const userStatusSchema = z.object({
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export const importUserRowSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
  email: z.email("Email inválido").toLowerCase(),
  username: z.string().trim().max(30).optional().or(z.literal("")),
  role: z.enum(["USER", "TOURNAMENT_MANAGER", "SUPERADMIN"]).default("USER"),
});

export const importUsersSchema = z.object({
  csv: z.string().min(1, "El archivo está vacío"),
  sendWelcomeEmail: z.boolean().default(true),
  markVerified: z.boolean().default(true),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ImportUserRowInput = z.infer<typeof importUserRowSchema>;
