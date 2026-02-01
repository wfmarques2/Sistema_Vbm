import { storage } from "./storage";
import { 
  drivers, vehicles, services, 
  type InsertDriver, type InsertVehicle, type InsertService 
} from "@shared/schema";

export async function seedDatabase() {
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
      paymentMethod: "invoice",
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
      paymentMethod: "invoice",
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
