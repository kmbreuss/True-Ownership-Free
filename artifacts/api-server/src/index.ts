import app from "./app";
import { logger } from "./lib/logger";
import { bootstrapOwner } from "./lib/bootstrapOwner";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Run owner bootstrap before listening. It's idempotent: only seeds an
// owner when the users table contains zero owners and INITIAL_OWNER_EMAIL +
// INITIAL_OWNER_PASSWORD env vars are both set. Failures are logged, never
// thrown — startup must never be blocked by bootstrap.
bootstrapOwner().finally(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
});
