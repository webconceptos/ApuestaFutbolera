import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

const hasSmtpConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

async function sendMail(to: string, subject: string, html: string) {
  if (!transporter) {
    // Sin SMTP configurado (típico en desarrollo local): no bloquear el flujo,
    // solo dejar constancia del email que se habría enviado. El mensaje
    // mantiene el prefijo "[email:dev]" literal porque scripts de prueba de
    // pasos anteriores hacen grep sobre él en los logs.
    logger.info(`[email:dev] Para: ${to} | Asunto: ${subject}\n${html}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "Golazo Mundial <noreply@golazomundial.local>",
      to,
      subject,
      html,
    });
  } catch (error) {
    logger.error({ err: error, to, subject }, "no se pudo enviar el email");
    throw error;
  }
}

export async function sendVerificationEmail(params: { to: string; name: string; token: string }) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${params.token}`;
  await sendMail(
    params.to,
    "Verifica tu cuenta en Golazo Mundial",
    `<p>Hola ${params.name},</p>
     <p>Confirma tu cuenta en Golazo Mundial haciendo clic en el siguiente enlace:</p>
     <p><a href="${url}">${url}</a></p>
     <p>Este enlace expira en 24 horas.</p>`
  );
}

export async function sendPasswordResetEmail(params: { to: string; name: string; token: string }) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/forgot-password?token=${params.token}`;
  await sendMail(
    params.to,
    "Recupera tu contraseña en Golazo Mundial",
    `<p>Hola ${params.name},</p>
     <p>Pediste restablecer tu contraseña. Haz clic en el siguiente enlace para elegir una nueva:</p>
     <p><a href="${url}">${url}</a></p>
     <p>Este enlace expira en 1 hora. Si no fuiste tú, ignora este email.</p>`
  );
}

export async function sendEmailChangeVerification(params: { to: string; name: string; token: string }) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${params.token}`;
  await sendMail(
    params.to,
    "Confirma tu nuevo email en Golazo Mundial",
    `<p>Hola ${params.name},</p>
     <p>Pediste cambiar el email de tu cuenta de Golazo Mundial a esta dirección. Confirma haciendo clic aquí:</p>
     <p><a href="${url}">${url}</a></p>
     <p>Mientras no confirmes, tu email anterior sigue activo. Este enlace expira en 24 horas.</p>`
  );
}

export async function sendAccountDeletionEmail(params: { to: string; name: string; token: string }) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/profile/danger?token=${params.token}`;
  await sendMail(
    params.to,
    "Confirma la eliminación de tu cuenta en Golazo Mundial",
    `<p>Hola ${params.name},</p>
     <p>Pediste eliminar tu cuenta de Golazo Mundial. Si estás seguro, confirma haciendo clic aquí:</p>
     <p><a href="${url}">${url}</a></p>
     <p>Este enlace expira en 24 horas. Si no fuiste tú, ignora este email y tu cuenta seguirá activa.</p>`
  );
}

export async function sendWelcomeEmail(params: { to: string; name: string; tempPassword: string }) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
  await sendMail(
    params.to,
    "Tu cuenta en Golazo Mundial",
    `<p>Hola ${params.name},</p>
     <p>Un administrador creó una cuenta para ti en Golazo Mundial. Estas son tus credenciales temporales:</p>
     <p>Email: ${params.to}<br/>Contraseña temporal: <strong>${params.tempPassword}</strong></p>
     <p>Te recomendamos cambiar la contraseña apenas inicies sesión, desde tu perfil.</p>
     <p><a href="${url}">Ir a iniciar sesión</a></p>`
  );
}

export async function sendPoolInviteEmail(params: { to: string; poolName: string; inviterName: string; inviteCode: string }) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/register?invite=${params.inviteCode}`;
  await sendMail(
    params.to,
    `${params.inviterName} te invitó a la polla "${params.poolName}" en Golazo Mundial`,
    `<p>Hola,</p>
     <p>${params.inviterName} te invitó a unirte a la polla "${params.poolName}" en Golazo Mundial.</p>
     <p>Crea tu cuenta (o inicia sesión si ya tienes una) y luego usa este enlace para unirte:</p>
     <p><a href="${url}">${url}</a></p>`
  );
}

export async function sendPoolMessageEmail(params: { to: string; name: string; poolName: string; title: string; message: string }) {
  await sendMail(
    params.to,
    `[${params.poolName}] ${params.title}`,
    `<p>Hola ${params.name},</p>
     <p>${params.message}</p>
     <p style="color:#94a3b8;font-size:12px">Mensaje enviado por el organizador de la polla "${params.poolName}".</p>`
  );
}

// Plantilla genérica usada por notifyUser() (src/lib/notifications.ts) para
// los tipos de notificación togglable (resultado, ranking, pago, etc.).
export async function sendNotificationEmail(params: { to: string; name: string; title: string; message: string }) {
  await sendMail(
    params.to,
    params.title,
    `<p>Hola ${params.name},</p>
     <p>${params.message}</p>
     <p style="color:#94a3b8;font-size:12px">Puedes ajustar qué notificaciones recibes por email desde tu perfil.</p>`
  );
}
