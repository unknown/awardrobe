import { Resend } from "resend";

const globalForResend = globalThis as { resend?: Resend };

export const resend: Resend = globalForResend.resend || new Resend(process.env.RESEND_API_KEY);

if (process.env.NODE_ENV !== "production") globalForResend.resend = resend;
