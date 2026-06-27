import { z } from "zod";

export const matchSchema = z.object({
  phase: z.string().trim().min(1, "Requerido").max(100),
  round: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  homeTeam: z.string().trim().min(1, "Requerido").max(80),
  awayTeam: z.string().trim().min(1, "Requerido").max(80),
  homeFlag: z.string().trim().min(1, "Requerido").max(10),
  awayFlag: z.string().trim().min(1, "Requerido").max(10),
  matchDate: z.string().min(1, "Requerido"),
  venue: z.string().trim().max(150).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  status: z.enum(["UPCOMING", "LIVE", "FINISHED", "CANCELLED"]).optional(),
});

export const matchResultSchema = z.object({
  homeScore: z.coerce.number().int().min(0, "No puede ser negativo").max(50),
  awayScore: z.coerce.number().int().min(0, "No puede ser negativo").max(50),
});

export type MatchInput = z.infer<typeof matchSchema>;
export type MatchResultInput = z.infer<typeof matchResultSchema>;
