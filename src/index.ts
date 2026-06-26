import { initDb } from "./db/init";
import { logger } from "./lib/logger";

logger.info("Initializing database...");
initDb()
  .then(() => {
    logger.info("Database ready. Starting bot...");
    return import("./bot");
  })
  .catch((err) => {
    logger.error({ err }, "Failed to initialize database");
    process.exit(1);
  });

process.on("uncaughtException",  (err)    => logger.error({ err }, "uncaughtException"));
process.on("unhandledRejection", (reason) => logger.error({ reason }, "unhandledRejection"));
process.on("SIGINT",  () => { logger.info("Shutting down..."); process.exit(0); });
process.on("SIGTERM", () => { logger.info("Shutting down..."); process.exit(0); });
