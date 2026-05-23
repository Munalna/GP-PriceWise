import { Resend } from "resend";

let _resend;
export function getResend() {
  if (_resend !== undefined) return _resend;
  _resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;
  return _resend;
}