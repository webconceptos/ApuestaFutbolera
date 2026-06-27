import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  username: z
    .string()
    .trim()
    .min(3, "El username debe tener al menos 3 caracteres")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guión bajo")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  bio: z.string().trim().max(160, "Máximo 160 caracteres").optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Requerido"),
  newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(72),
});

export const changeEmailSchema = z.object({
  newEmail: z.email("Email inválido").toLowerCase(),
  currentPassword: z.string().min(1, "Requerido"),
});

export const notifPrefsSchema = z.object({
  email: z.object({
    resultScored: z.boolean(),
    rankChange: z.boolean(),
    deadlineWarning: z.boolean(),
    paymentConfirmed: z.boolean(),
  }),
  inApp: z.object({
    resultScored: z.boolean(),
    rankChange: z.boolean(),
    deadlineWarning: z.boolean(),
  }),
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal("ELIMINAR", 'Debes escribir "ELIMINAR"'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type NotifPrefsInput = z.infer<typeof notifPrefsSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
