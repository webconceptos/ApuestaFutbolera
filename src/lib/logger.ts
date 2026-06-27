import pino from "pino";

// Logger estructurado (Paso 29, CLAUDE.md sección Infraestructura). En
// desarrollo usa pino-pretty para que sea legible en la terminal; en
// producción emite JSON plano para que lo recoja el log driver de Docker.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" } },
});
