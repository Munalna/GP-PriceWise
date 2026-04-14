import { Resend } from "resend";

// TODO: Add RESEND_API_KEY to .env to enable emails (sign up at resend.com)
export const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;