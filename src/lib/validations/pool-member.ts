import { z } from "zod";

export const paymentUpdateSchema = z.object({
  hasPaid: z.boolean(),
  paymentNote: z.string().trim().max(200).optional().or(z.literal("")),
});

export const memberRoleSchema = z.object({
  role: z.enum(["PLAYER", "MODERATOR"]),
});

export const memberMessageSchema = z.object({
  title: z.string().trim().min(1, "Requerido").max(100),
  message: z.string().trim().min(1, "Requerido").max(1000),
});

export const addMemberSchema = z.object({
  email: z.email("Email inválido").toLowerCase(),
});

export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;
