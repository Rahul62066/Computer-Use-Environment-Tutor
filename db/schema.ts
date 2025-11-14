import { pgTable, text, timestamp, serial, integer, primaryKey } from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from "next-auth/adapters"

// Users table for authentication
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
})

// Accounts table for OAuth providers
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

// Sessions table
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

// Verification tokens table
export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verficationToken) => ({
    compositePk: primaryKey({
      columns: [verficationToken.identifier, verficationToken.token],
    }),
  })
)

// Events table schema - updated to link with users
export const eventsTable = pgTable('events', {
  id: serial('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  googleEventId: text('googleEventId'), // Store Google Calendar event ID
  date: timestamp('date').notNull(),
  endDate: timestamp('endDate'), // Add end date for events
  title: text('title').notNull(),
  description: text('description').notNull(),
  guests: text('guests'), // Store guest emails as comma-separated string
});

// Tasks table schema
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  googleTaskId: text('googleTaskId'), // Store Google Tasks ID if synced
  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('dueDate'),
  completed: integer('completed').default(0), // 0 = not completed, 1 = completed
  createdAt: timestamp('createdAt').defaultNow(),
});

// Appointments table schema
export const appointmentsTable = pgTable('appointments', {
  id: serial('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  googleEventId: text('googleEventId'), // Store Google Calendar event ID
  title: text('title').notNull(),
  description: text('description'),
  startDate: timestamp('startDate').notNull(),
  endDate: timestamp('endDate').notNull(),
  duration: integer('duration'), // Duration in minutes
  bufferTime: integer('bufferTime'), // Buffer time between appointments in minutes
  location: text('location'),
  guests: text('guests'), // Store guest emails as comma-separated string
  createdAt: timestamp('createdAt').defaultNow(),
});