import { storage } from "./storage";
import { 
  drivers, vehicles, services, localAuth, users, profiles,
  type InsertDriver, type InsertVehicle, type InsertService 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomBytes, pbkdf2Sync } from "crypto";

export async function seedDatabase() {
  // Seed local auth default admin if not exists
  const adminEmail = "admin@vbm.com.br";
  const [existingUser] = await db.select().from(users).where(eq(users.email, adminEmail));
  let adminUserId = existingUser?.id;
  if (!existingUser) {
    const [created] = await db.insert(users).values({
      email: adminEmail,
      firstName: "Admin",
      lastName: "VBM",
    }).returning();
    adminUserId = created.id;
  }
  // Ensure local auth credentials exist or are updated for admin user
  if (adminUserId) {
    const salt = randomBytes(16).toString("base64");
    const hash = pbkdf2Sync("admin123", salt, 100000, 64, "sha512").toString("base64");
    await db.insert(localAuth).values({
      userId: adminUserId!,
      passwordSalt: salt,
      passwordHash: hash,
    }).onConflictDoUpdate({
      target: localAuth.userId,
      set: {
        passwordSalt: salt,
        passwordHash: hash,
        updatedAt: new Date(),
      },
    });
    // Também definir users.password para ambientes que usam senha em texto (apenas dev)
    await db.update(users).set({ password: "admin123" }).where(eq(users.id, adminUserId!));
    
    // Ensure profile with admin role exists
    const [existingProfile] = await db.select().from(profiles).where(eq(profiles.userId, adminUserId!));
    if (!existingProfile) {
        await db.insert(profiles).values({
            userId: adminUserId!,
            name: "Admin VBM",
            role: "admin"
        });
    } else if (existingProfile.role !== "admin") {
        await db.update(profiles).set({ role: "admin" }).where(eq(profiles.id, existingProfile.id));
    }

    console.log("Ensured local admin credentials:", adminEmail, "password: admin123");
  }

  const existingDrivers = await storage.getDrivers();
  if (existingDrivers.length > 0) return;

  console.log("Seeding database...");

  // Drivers
  const driverData: InsertDriver[] = [
    { name: "João Silva", phone: "11999999999", type: "fixed", licenseValidity: "2028-01-01", notes: "Experiente em blindados" },
    { name: "Carlos Oliveira", phone: "11988888888", type: "freelance", licenseValidity: "2027-05-15", notes: "Disponível fds" },
    { name: "Maria Santos", phone: "11977777777", type: "fixed", licenseValidity: "2029-11-20" },
  ];

  const createdDrivers = [];
  for (const d of driverData) {
    createdDrivers.push(await storage.createDriver(d));
  }

  // Vehicles
  const vehicleData: InsertVehicle[] = [
    { model: "Toyota Corolla", plate: "ABC-1234", capacity: 4, status: "available", notes: "Blindado" },
    { model: "MB Vito", plate: "XYZ-9876", capacity: 7, status: "in_use" },
    { model: "Honda Civic", plate: "DEF-5678", capacity: 4, status: "maintenance" },
  ];

  const createdVehicles = [];
  for (const v of vehicleData) {
    createdVehicles.push(await storage.createVehicle(v));
  }

  // Services
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  const serviceData: InsertService[] = [
    {
      dateTime: today,
      origin: "Av. Paulista, 1000",
      destination: "Aeroporto Guarulhos",
      type: "airport",
      clientName: "Empresa X",
      clientPhone: "1133333333",
      driverId: createdDrivers[0].id,
      vehicleId: createdVehicles[0].id,
      value: "350.00",
      paymentMethod: "credit_card",
      status: "scheduled",
      notes: "Voo G3 1234"
    },
    {
      dateTime: tomorrow,
      origin: "Hotel Fasano",
      destination: "Fábrica ABC (Interior)",
      type: "corporate",
      clientName: "Diretoria Y",
      clientPhone: "1144444444",
      driverId: createdDrivers[1].id,
      vehicleId: createdVehicles[1].id,
      value: "800.00",
      paymentMethod: "credit_card",
      status: "scheduled"
    },
    {
      dateTime: yesterday,
      origin: "Aeroporto Congonhas",
      destination: "Jardins",
      type: "airport",
      clientName: "Cliente VIP",
      clientPhone: "1155555555",
      driverId: createdDrivers[2].id,
      vehicleId: createdVehicles[0].id, // Reusing vehicle (was available yesterday)
      value: "200.00",
      paymentMethod: "cash",
      status: "finished"
    }
  ];

  for (const s of serviceData) {
    await storage.createService(s);
  }

  console.log("Database seeded!");
}
