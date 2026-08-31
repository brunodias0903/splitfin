import "server-only";

import nodemailer from "nodemailer";

const getTransport = () => {
  const host = process.env.AUTH_SMTP_HOST;

  if (!host) {
    throw new Error("AUTH_SMTP_HOST is required to send authentication emails.");
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.AUTH_SMTP_PORT ?? 1025),
    secure: process.env.AUTH_SMTP_SECURE === "true",
    ...(process.env.AUTH_SMTP_USER
      ? {
          auth: {
            user: process.env.AUTH_SMTP_USER,
            pass: process.env.AUTH_SMTP_PASSWORD,
          },
        }
      : {}),
  });
};

interface AuthEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendAuthEmail(message: AuthEmail) {
  await getTransport().sendMail({
    from: process.env.AUTH_EMAIL_FROM ?? "Splitfin <no-reply@splitfin.local>",
    ...message,
  });
}
