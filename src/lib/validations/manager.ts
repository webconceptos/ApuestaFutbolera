import { z } from "zod";

export const assignManagerSchema = z.object({
  userId: z.string().min(1, "Requerido"),
  canEditMatches: z.boolean().default(true),
  canEnterResults: z.boolean().default(true),
  canCreateMatches: z.boolean().default(false),
});

export const updateManagerPermissionsSchema = z.object({
  canEditMatches: z.boolean(),
  canEnterResults: z.boolean(),
  canCreateMatches: z.boolean(),
});

export type AssignManagerInput = z.infer<typeof assignManagerSchema>;
