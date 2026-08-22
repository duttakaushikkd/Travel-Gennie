import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { FareComparison, Itinerary, TripState } from "@/lib/trip";

export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  title: text("title").notNull().default("Untitled trip"),
  status: text("status").notNull().default("intake"),
  tripState: jsonb("trip_state").$type<TripState>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const itineraries = pgTable("itineraries", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  days: jsonb("days").$type<Itinerary>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const fareQuotes = pgTable("fare_quotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  amount: integer("amount"),
  currency: text("currency").notNull().default("INR"),
  comparison: jsonb("comparison").$type<FareComparison>().notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
});
