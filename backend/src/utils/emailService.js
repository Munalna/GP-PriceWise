import { resend } from "../config/resend.js";

export async function sendSeasonStartEmail(toEmail, seasonName) {

  const { data, error } = await resend.emails.send({
    from: "PriceWise <onboarding@resend.dev>",
    to: [toEmail],
    subject: "Season Started",
    html: `
      <h2>Season Started</h2>
      <p>Your season "<b>${seasonName}</b>" has started.</p>
      <p>Seasonal pricing rules are now active.</p>
    `
  });

  if (error) {
    throw error;
  }

  return data;
}