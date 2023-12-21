import { Resend } from "resend";

const resendSingleton = () => {
  return new Resend(process.env.RESEND_API_KEY!);
};

export const resend = resendSingleton();
