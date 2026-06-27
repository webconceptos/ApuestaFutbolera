import { z } from "zod";

export const createPoolSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  logo: z.union([z.url("URL inválida"), z.literal("")]).optional(),
  inviteOnly: z.boolean().default(true),
});

export type CreatePoolInput = z.infer<typeof createPoolSchema>;

export const updatePoolGeneralSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  logo: z.union([z.url("URL inválida"), z.literal("")]).optional(),
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Debe ser un color hex, ej. #F59E0B"),
  welcomeMessage: z.string().trim().max(1000).optional().or(z.literal("")),
  rules: z.string().trim().max(5000).optional().or(z.literal("")),
});

export type UpdatePoolGeneralInput = z.infer<typeof updatePoolGeneralSchema>;

// CSV ordenado; cada criterio debe ser uno de los reconocidos por calculateRanking()
// (ver src/lib/scoring.ts). No se valida como enum porque el motor ignora
// silenciosamente cualquier criterio desconocido.
export const updatePoolScoringSchema = z.object({
  predictionDeadlineHours: z.coerce.number().int().min(0).max(72),
  pointsExactScore: z.coerce.number().int().min(0).max(100),
  pointsCorrectResult: z.coerce.number().int().min(0).max(100),
  pointsCorrectGoalDiff: z.coerce.number().int().min(0).max(100),
  bonusKnockout: z.coerce.number().min(0).max(10),
  bonusFinal: z.coerce.number().min(0).max(10),
  tiebreakerCriteria: z.string().trim().min(1, "Requerido al menos un criterio"),
  // ISO string (ya convertida desde hora de Lima en el cliente, ver
  // peruDatetimeLocalToUtc) o null para quitar el corte.
  scoringStartDate: z.string().nullable(),
  scoringEndDate: z.string().nullable(),
});

export type UpdatePoolScoringInput = z.infer<typeof updatePoolScoringSchema>;

export const updatePoolFeeSchema = z.object({
  entryFeeEnabled: z.boolean(),
  entryFeeAmount: z.coerce.number().min(0).max(1_000_000),
  entryFeeCurrency: z.string().trim().min(1).max(10),
  entryFeeInstructions: z.string().trim().max(2000).optional().or(z.literal("")),
  prizeDescription: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type UpdatePoolFeeInput = z.infer<typeof updatePoolFeeSchema>;

export const updatePoolVisibilitySchema = z.object({
  inviteOnly: z.boolean(),
  isPublic: z.boolean(),
  registrationOpen: z.boolean(),
  maxMembers: z.coerce.number().int().min(2).max(500),
  publicPanelEnabled: z.boolean(),
  publicShowRanking: z.boolean(),
  publicShowPredictions: z.boolean(),
  publicShowFixture: z.boolean(),
  showOthersPredictions: z.enum(["NEVER", "AFTER_MATCH", "AFTER_SCORED", "ALWAYS"]),
});

export type UpdatePoolVisibilityInput = z.infer<typeof updatePoolVisibilitySchema>;

export const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, "Selecciona un miembro"),
});

export const deletePoolSchema = z.object({
  confirmation: z.literal("ELIMINAR"),
});
