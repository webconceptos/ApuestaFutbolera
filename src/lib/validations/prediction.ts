import { z } from "zod";

export const predictionSchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.coerce.number().int().min(0, "No puede ser negativo").max(20, "Máximo 20"),
  awayScore: z.coerce.number().int().min(0, "No puede ser negativo").max(20, "Máximo 20"),
});

export type PredictionInput = z.infer<typeof predictionSchema>;
