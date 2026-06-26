import { db } from "./client";
import { sql } from "drizzle-orm";

export async function initDb(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id              BIGINT PRIMARY KEY,
      first_name      VARCHAR(256) NOT NULL,
      last_name       VARCHAR(256),
      username        VARCHAR(256),
      balance         BIGINT NOT NULL DEFAULT 0,
      is_activated    BOOLEAN NOT NULL DEFAULT FALSE,
      activated_at    TIMESTAMP,
      is_blocked      BOOLEAN NOT NULL DEFAULT FALSE,
      referral_code   VARCHAR(32) NOT NULL UNIQUE,
      referral_count  INTEGER NOT NULL DEFAULT 0,
      referred_by     BIGINT,
      joined_at       TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS tokens (
      code                VARCHAR(64) PRIMARY KEY,
      created_by_admin_id BIGINT NOT NULL,
      created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
      is_used             BOOLEAN NOT NULL DEFAULT FALSE,
      used_by_user_id     BIGINT,
      used_at             TIMESTAMP,
      status              VARCHAR(16) NOT NULL DEFAULT 'active',
      grace_started_at    TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS balance_requests (
      id              VARCHAR(32) PRIMARY KEY,
      user_id         BIGINT NOT NULL,
      amount          BIGINT NOT NULL,
      receipt_file_id VARCHAR(256),
      requested_at    TIMESTAMP NOT NULL DEFAULT NOW(),
      status          VARCHAR(16) NOT NULL DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS support_tickets (
      id               VARCHAR(32) PRIMARY KEY,
      user_id          BIGINT NOT NULL,
      status           VARCHAR(16) NOT NULL DEFAULT 'open',
      created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
      last_reminder_at TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id        SERIAL PRIMARY KEY,
      ticket_id VARCHAR(32) NOT NULL,
      from_role VARCHAR(8) NOT NULL,
      text      TEXT NOT NULL,
      at        TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS settings (
      key   VARCHAR(64) PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages (ticket_id);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id   ON support_tickets (user_id);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_status    ON support_tickets (status);
    CREATE INDEX IF NOT EXISTS idx_users_username            ON users (username);
  `);

  /* ── Migrations for existing installations ─────────────────────────────── */
  await db.execute(sql`ALTER TABLE users ALTER COLUMN balance TYPE BIGINT`).catch(() => {});
  await db.execute(sql`ALTER TABLE balance_requests ALTER COLUMN amount TYPE BIGINT`).catch(() => {});
  await db.execute(sql`ALTER TABLE balance_requests ADD COLUMN IF NOT EXISTS receipt_file_id VARCHAR(256)`).catch(() => {});
  await db.execute(sql`ALTER TABLE tokens ADD COLUMN IF NOT EXISTS status VARCHAR(16) NOT NULL DEFAULT 'active'`).catch(() => {});
  await db.execute(sql`ALTER TABLE tokens ADD COLUMN IF NOT EXISTS grace_started_at TIMESTAMP`).catch(() => {});
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(32)`).catch(() => {});
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_api_id INTEGER`).catch(() => {});
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_api_hash VARCHAR(64)`).catch(() => {});
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_session TEXT`).catch(() => {});
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS clock_enabled BOOLEAN NOT NULL DEFAULT FALSE`).catch(() => {});
}
