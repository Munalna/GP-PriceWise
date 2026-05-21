import { getResend } from "../config/resend.js";

export async function sendSeasonStartEmail(toEmail, seasonName) {
  const resend = getResend();

  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping season email.");
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: "PriceWise <onboarding@resend.dev>",
    to: [toEmail],
    subject: "Season Started",
    html: `
      <h2>Season Started</h2>
      <p>Your season "<b>${seasonName}</b>" has started.</p>
      <p>Seasonal pricing rules are now active.</p>
    `,
  });

  if (error) throw error;
  return data;
}