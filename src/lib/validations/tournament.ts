import { z } from "zod";

const tournamentFields = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(150),
  shortName: z.string().trim().min(2, "Mínimo 2 caracteres").max(60),
  logo: z.union([z.url("URL inválida"), z.literal("")]).optional(),
  sport: z.string().trim().min(2).max(40).default("football"),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  season: z.string().trim().min(2, "Requerido").max(20),
  startDate: z.string().min(1, "Requerido"),
  endDate: z.string().min(1, "Requerido"),
  isPublic: z.boolean().default(true),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const tournamentSchema = tournamentFields.refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: "La fecha de fin debe ser igual o posterior a la de inicio", path: ["endDate"] }
);

export const tournamentStatusSchema = z.object({
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

export type TournamentInput = z.infer<typeof tournamentSchema>;
