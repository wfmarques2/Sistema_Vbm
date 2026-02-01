import { pgTable, text, serial, integer, boolean, timestamp, date, numeric, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
import { relations } from "drizzle-orm";

export * from "./models/auth";

// --- Enums ---
export const driverTypeEnum = ["fixed", "freelance"] as const;
export const vehicleStatusEnum = ["available", "in_use", "maintenance"] as const;
export const serviceTypeEnum = ["airport", "corporate", "city_tour", "hourly"] as const;
export const paymentMethodEnum = ["pix", "cash", "invoice"] as const;
export const serviceStatusEnum = ["scheduled", "in_progress", "finished", "canceled"] as const;

// --- Tables ---

// Profiles to store extra user data like roles
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["admin", "operational"] }).default("operational").notNull(),
  name: text("name").notNull(),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  type: text("type", { enum: driverTypeEnum }).notNull(),
  licenseValidity: date("license_validity").notNull(), // CNH validity
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  model: text("model").notNull(),
  plate: text("plate").notNull().unique(),
  capacity: integer("capacity").notNull(),
  status: text("status", { enum: vehicleStatusEnum }).default("available").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  dateTime: timestamp("date_time").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  type: text("type", { enum: serviceTypeEnum }).notNull(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  driverId: integer("driver_id").references(() => drivers.id),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method", { enum: paymentMethodEnum }).notNull(),
  status: text("status", { enum: serviceStatusEnum }).default("scheduled").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Relations ---

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  driver: one(drivers, {
    fields: [services.driverId],
    references: [drivers.id],
  }),
  vehicle: one(vehicles, {
    fields: [services.vehicleId],
    references: [vehicles.id],
  }),
}));

export const driversRelations = relations(drivers, ({ many }) => ({
  services: many(services),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  services: many(services),
}));

// --- Schemas ---

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertDriverSchema = createInsertSchema(drivers).omit({ id: true, createdAt: true });
export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, createdAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true });

// --- Types ---

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type ServiceWithDetails = Service & {
  driver?: Driver | null;
  vehicle?: Vehicle | null;
};
