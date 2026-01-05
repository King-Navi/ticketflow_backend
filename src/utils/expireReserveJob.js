import { expireReservationsService } from "../repositories/utils/expirationJob.js";

const CLEANUP_INTERVAL_MS = 1 * 60 * 1000; //10  min

export function startReservationCleanupJob() {
  expireReservationsService().catch((err) => {
    console.error("Initial reservation cleanup failed:", err);
  });

  setInterval(() => {
    expireReservationsService().catch((err) => {
      console.error("Reservation cleanup failed:", err);
    });
  }, CLEANUP_INTERVAL_MS);

  console.log(
    `[JOB] Reservation cleanup enabled every ${CLEANUP_INTERVAL_MS / 60000} minutes`
  );
}