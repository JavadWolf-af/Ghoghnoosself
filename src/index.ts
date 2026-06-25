import "./bot";
import { logger } from "./lib/logger";

logger.info("Ghoghnoosself bot is running...");

process.on("uncaughtException", (err) => logger.error({ err }, "uncaughtException"));
process.on("unhandledRejection", (reason) => logger.error({ reason }, "unhandledRejection"));
process.on("SIGINT", () => { logger.info("Shutting down..."); process.exit(0); });
process.on("SIGTERM", () => { logger.info("Shutting down..."); process.exit(0); });
