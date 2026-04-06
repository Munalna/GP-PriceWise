import cron from "node-cron";
import { getSeasonsToActivate, activateSeason } from "../models/seasonModel.js";
import { createNotification } from "../models/notificationModel.js";
import { sendSeasonStartEmail } from "../utils/emailService.js";
import { supabaseAdmin } from "../config/supabase.js";

export function startSeasonScheduler() {
  console.log("Season scheduler started");

  cron.schedule(
    "5 0 * * *",
    async () => {
      try {
        console.log("Checking seasons to activate...");

        const seasons = await getSeasonsToActivate();
        console.log("Seasons found:", seasons);

        for (const season of seasons) {
          try {
            const activatedSeason = await activateSeason(season.id);

            const { data: userData, error: userError } =
              await supabaseAdmin.auth.admin.getUserById(
                activatedSeason.user_id
              );

            if (userError) {
              throw userError;
            }

            const userEmail = userData?.user?.email;

            if (userEmail) {
              await sendSeasonStartEmail(
                userEmail,
                activatedSeason.season_name
              );
            }

            await createNotification({
              user_id: activatedSeason.user_id,
              type: "season_started",
              title: "Season Started",
              message: `Your season "${activatedSeason.season_name}" has started.`,
              season_id: activatedSeason.id,
            });

            console.log(`Season activated: ${activatedSeason.season_name}`);
          } catch (seasonError) {
            console.error(
              "Error processing season:",
              season.season_name,
              seasonError
            );
          }
        }
      } catch (error) {
        console.error("Season scheduler error:", error);
      }
    },
    {
      timezone: "Asia/Riyadh",
    }
  );
}