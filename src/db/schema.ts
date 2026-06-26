import {
  pgTable, bigint, varchar, boolean, integer,
  text, timestamp, serial,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id:           bigint("id", { mode: "number" }).primaryKey(),
  firstName:    varchar("first_name", { length: 256 }).notNull(),
  lastName:     varchar("last_name",  { length: 256 }),
  username:     varchar("username",   { length: 256 }),
  balance:      bigint("balance", { mode: "number" }).notNull().default(0),
  isActivated:  boolean("is_activated").notNull().default(false),
  activatedAt:  timestamp("activated_at"),
  isBlocked:    boolean("is_blocked").notNull().default(false),
  referralCode: varchar("referral_code", { length: 32 }).notNull().unique(),
  referralCount:integer("referral_count").notNull().default(0),
  referredBy:   bigint("referred_by", { mode: "number" }),
  joinedAt:     timestamp("joined_at").notNull().defaultNow(),
});

export const tokens = pgTable("tokens", {
  code:            varchar("code", { length: 64 }).primaryKey(),
  createdByAdminId:bigint("created_by_admin_id", { mode: "number" }).notNull(),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  isUsed:          boolean("is_used").notNull().default(false),
  usedByUserId:    bigint("used_by_user_id", { mode: "number" }),
  usedAt:          timestamp("used_at"),
});

export const balanceRequests = pgTable("balance_requests", {
  id:            varchar("id", { length: 32 }).primaryKey(),
  userId:        bigint("user_id", { mode: "number" }).notNull(),
  amount:        bigint("amount", { mode: "number" }).notNull(),
  receiptFileId: varchar("receipt_file_id", { length: 256 }),
  requestedAt:   timestamp("requested_at").notNull().defaultNow(),
  status:        varchar("status", { length: 16 }).notNull().default("pending"),
});

export const supportTickets = pgTable("support_tickets", {
  id:             varchar("id", { length: 32 }).primaryKey(),
  userId:         bigint("user_id", { mode: "number" }).notNull(),
  status:         varchar("status", { length: 16 }).notNull().default("open"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
  lastReminderAt: timestamp("last_reminder_at"),
});

export const ticketMessages = pgTable("ticket_messages", {
  id:       serial("id").primaryKey(),
  ticketId: varchar("ticket_id", { length: 32 }).notNull(),
  fromRole: varchar("from_role", { length: 8 }).notNull(),
  text:     text("text").notNull(),
  at:       timestamp("at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key:   varchar("key",   { length: 64 }).primaryKey(),
  value: text("value").notNull(),
});
