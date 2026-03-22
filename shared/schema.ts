import { pgTable, text, serial, integer, boolean, timestamp, date, numeric, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
import { relations, sql } from "drizzle-orm";

export * from "./models/auth";

// --- Enums ---
export const driverTypeEnum = ["fixed", "freelance"] as const;
export const vehicleStatusEnum = ["available", "in_use", "maintenance"] as const;
export const vehicleTypeEnum = ["sedan","suv","minivan","van","micro_onibus","onibus","blindado"] as const;
export const serviceTypeEnum = ["airport", "corporate", "city_tour", "hourly"] as const;
export const paymentMethodEnum = ["pix", "cash", "credit_card", "debit_card", "saldo"] as const;
export const serviceStatusEnum = ["scheduled", "driving_pickup", "pickup_location", "driving_destination", "finished", "canceled"] as const;
// Status de pagamento para controles financeiros
export const paymentStatusEnum = ["pending", "paid", "saldo", "partial", "overdue", "canceled", "pay_driver"] as const;
// Método de pagamento para o restante em caso de pagamento parcial
export const remainderMethodEnum = ["pix", "pay_driver"] as const;

// --- Tables ---

// Profiles to store extra user data like roles
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["admin", "operational", "driver"] }).default("operational").notNull(),
  driverId: integer("driver_id"),
  name: text("name").notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  nationality: text("nationality"),
  documentType: text("document_type"),
  documentNumber: text("document_number"),
  balanceCentavos: integer("balance_centavos").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Dependentes de clientes (pessoas que podem fazer a viagem e o cliente paga)
export const clientDependents = pgTable("client_dependents", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  type: text("type", { enum: driverTypeEnum }).notNull(),
  licenseValidity: date("license_validity").notNull(), // CNH validity
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const driverPushTokens = pgTable("driver_push_tokens", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  token: text("token").notNull().unique(),
  platform: text("platform"),
  userAgent: text("user_agent"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  model: text("model").notNull(),
  plate: text("plate").notNull().unique(),
  capacity: integer("capacity").notNull(),
  color: text("color"),
  luggageCapacity: integer("luggage_capacity").default(0).notNull(),
  type: text("type", { enum: vehicleTypeEnum }).default("sedan").notNull(),
  status: text("status", { enum: vehicleStatusEnum }).default("available").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  dateTime: timestamp("date_time").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  stop1: text("stop_1"),
  stop2: text("stop_2"),
  stop3: text("stop_3"),
  stop4: text("stop_4"),
  stop5: text("stop_5"),
  type: text("type", { enum: serviceTypeEnum }).notNull(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  clientId: integer("client_id").references(() => clients.id),
  parentServiceId: integer("parent_service_id"),
  isReturn: boolean("is_return").default(false).notNull(),
  driverId: integer("driver_id").references(() => drivers.id),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method", { enum: paymentMethodEnum }).notNull(),
  status: text("status", { enum: serviceStatusEnum }).default("scheduled").notNull(),
  notes: text("notes"),
  // Novos campos operacionais
  passengers: integer("passengers"),                // quantidade de passageiros
  bags: integer("bags").default(0),                 // quantidade de malas
  carModel: text("car_model"),                      // modelo de carro desejado
  mozioId: text("mozio_id"),                        // ID de integração Mozio
  flight: text("flight"),                           // Número do voo
  // Distribuição de passageiros (Adulto, Criança, Bebê, Sênior, Livre)
  paxAdt: integer("pax_adt").default(0).notNull(),
  paxChd: integer("pax_chd").default(0).notNull(),
  paxInf: integer("pax_inf").default(0).notNull(),
  paxSen: integer("pax_sen").default(0).notNull(),
  paxFree: integer("pax_free").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  // --- Campos financeiros e operacionais adicionais ---
  // Valor cobrado em centavos (inteiro). Mantém compatibilidade sem remover "value".
  valorCobrado: integer("valor_cobrado").default(0),
  // Forma de pagamento específica do financeiro (enum). Opcional para não quebrar inserções existentes.
  formaPagamento: text("forma_pagamento", { enum: paymentMethodEnum }),
  // Status do pagamento (enum) com default para permitir inserções antigas.
  statusPagamento: text("status_pagamento", { enum: paymentStatusEnum }).default("pending"),
  // Pagamento parcial: valor já pago em centavos
  valorPagoParcial: integer("valor_pago_parcial").default(0),
  // Como será pago o restante (pix ou diretamente ao motorista)
  restanteMetodo: text("restante_metodo", { enum: remainderMethodEnum }),
  // Detalhe do método quando o restante é "ao motorista"
  restanteMetodoDriver: text("restante_metodo_driver", { enum: paymentMethodEnum }),
  // Quilometragens previstas/realizadas (decimal), úteis para cálculo de custos.
  kmPrevisto: numeric("km_previsto", { precision: 8, scale: 2 }),
  kmReal: numeric("km_real", { precision: 8, scale: 2 }),
  // Custos operacionais em centavos (inteiros) com default 0 para não exigir no insert.
  combustivel: integer("combustivel").default(0).notNull(),
  pedagio: integer("pedagio").default(0).notNull(),
  estacionamento: integer("estacionamento").default(0).notNull(),
  alimentacao: integer("alimentacao").default(0).notNull(),
  outrosCustos: integer("outros_custos").default(0).notNull(),
  observacaoCustos: text("observacao_custos"),
  // Dados adicionais de voucher
  hasReturn: boolean("has_return").default(false).notNull(),
  returnDateTime: timestamp("return_date_time"),
  returnOrigin: text("return_origin"),
  returnDestination: text("return_destination"),
  returnFlight: text("return_flight"),
  returnDriverId: integer("return_driver_id").references(() => drivers.id),
  returnVehicleId: integer("return_vehicle_id").references(() => vehicles.id),
  guide: text("guide"),
});

export const userInvitations = pgTable("user_invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "operational", "driver"] }).default("operational").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tokens de redefinição de senha
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Módulo financeiro ---
// Logs de quilometragem de veículos (odômetro)
export const vehicleKmLogs = pgTable("vehicle_km_logs", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  driverId: integer("driver_id").references(() => drivers.id),
  serviceId: integer("service_id").references(() => services.id),
  logAt: timestamp("log_at").defaultNow().notNull(),
  // Odômetros em quilômetros inteiros
  odometroInicial: integer("odometro_inicial"),
  odometroFinal: integer("odometro_final"),
  observacao: text("observacao"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Despesas vinculadas ao veículo (em centavos)
export const vehicleExpenses = pgTable("vehicle_expenses", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  serviceId: integer("service_id").references(() => services.id),
  // Categoria livre para flexibilidade (combustível, pedágio, estacionamento, manutenção, etc.)
  categoria: text("categoria").notNull(),
  valorCentavos: integer("valor_centavos").notNull(),
  descricao: text("descricao"),
  ocorridaEm: timestamp("ocorrida_em").defaultNow().notNull(),
  statusPagamento: text("status_pagamento", { enum: paymentStatusEnum }).default("pending"),
  pagoEm: timestamp("pago_em"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Despesas gerais da empresa (em centavos)
export const companyExpenses = pgTable("company_expenses", {
  id: serial("id").primaryKey(),
  categoria: text("categoria").notNull(),
  valorCentavos: integer("valor_centavos").notNull(),
  descricao: text("descricao"),
  pagoPara: text("pago_para"),
  ocorridaEm: timestamp("ocorrida_em").defaultNow().notNull(),
  statusPagamento: text("status_pagamento", { enum: paymentStatusEnum }).default("pending"),
  pagoEm: timestamp("pago_em"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pagamentos a motoristas (em centavos)
export const driverPayments = pgTable("driver_payments", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  serviceId: integer("service_id").references(() => services.id),
  valorCentavos: integer("valor_centavos").notNull(),
  metodoPagamento: text("metodo_pagamento", { enum: paymentMethodEnum }),
  statusPagamento: text("status_pagamento", { enum: paymentStatusEnum }).default("pending"),
  periodoInicio: date("periodo_inicio"),
  periodoFim: date("periodo_fim"),
  pagoEm: timestamp("pago_em"),
  observacao: text("observacao"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Relations ---

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  services: many(services),
  dependents: many(clientDependents),
}));

export const clientDependentsRelations = relations(clientDependents, ({ one }) => ({
  client: one(clients, { fields: [clientDependents.clientId], references: [clients.id] }),
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
  client: one(clients, {
    fields: [services.clientId],
    references: [clients.id],
  }),
  // Despesas do serviço vinculadas ao veículo
}));

export const driversRelations = relations(drivers, ({ many }) => ({
  services: many(services),
  kmLogs: many(vehicleKmLogs),
  payments: many(driverPayments),
  pushTokens: many(driverPushTokens),
}));

export const driverPushTokensRelations = relations(driverPushTokens, ({ one }) => ({
  driver: one(drivers, { fields: [driverPushTokens.driverId], references: [drivers.id] }),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  services: many(services),
  kmLogs: many(vehicleKmLogs),
  expenses: many(vehicleExpenses),
}));

export const vehicleKmLogsRelations = relations(vehicleKmLogs, ({ one }) => ({
  vehicle: one(vehicles, { fields: [vehicleKmLogs.vehicleId], references: [vehicles.id] }),
  driver: one(drivers, { fields: [vehicleKmLogs.driverId], references: [drivers.id] }),
  service: one(services, { fields: [vehicleKmLogs.serviceId], references: [services.id] }),
}));

export const vehicleExpensesRelations = relations(vehicleExpenses, ({ one }) => ({
  vehicle: one(vehicles, { fields: [vehicleExpenses.vehicleId], references: [vehicles.id] }),
  service: one(services, { fields: [vehicleExpenses.serviceId], references: [services.id] }),
}));

export const companyExpensesRelations = relations(companyExpenses, ({}) => ({}));

export const driverPaymentsRelations = relations(driverPayments, ({ one }) => ({
  driver: one(drivers, { fields: [driverPayments.driverId], references: [drivers.id] }),
  service: one(services, { fields: [driverPayments.serviceId], references: [services.id] }),
}));

// Receitas manuais e créditos de clientes (em centavos)
export const companyRevenues = pgTable("company_revenues", {
  id: serial("id").primaryKey(),
  categoria: text("categoria").notNull(),
  valorCentavos: integer("valor_centavos").notNull(),
  descricao: text("descricao"),
  clientId: integer("client_id").references(() => clients.id),
  serviceId: integer("service_id").references(() => services.id),
  recebidaEm: timestamp("recebida_em").defaultNow().notNull(),
  metodoPagamento: text("metodo_pagamento", { enum: paymentMethodEnum }),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Schemas ---

// Local authentication table (email/senha vinculada ao usuário)
export const localAuth = pgTable("local_auth", {
  userId: text("user_id").primaryKey().references(() => users.id),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertClientDependentSchema = createInsertSchema(clientDependents).omit({ id: true, createdAt: true });
export const insertDriverSchema = createInsertSchema(drivers).omit({ id: true, createdAt: true });
export const insertDriverPushTokenSchema = createInsertSchema(driverPushTokens).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVehicleSchema = createInsertSchema(vehicles)
  .omit({ id: true, createdAt: true })
  .extend({
    capacity: z.coerce.number().int().positive(),
    luggageCapacity: z.coerce.number().int().min(0).default(0),
  });
export const insertServiceSchema = createInsertSchema(services)
  .omit({ id: true, createdAt: true })
  .extend({
    dateTime: z.coerce.date(),
    parentServiceId: z.coerce.number().int().optional(),
    isReturn: z.coerce.boolean().optional(),
    hasReturn: z.coerce.boolean().optional(),
    returnDateTime: z.coerce.date().optional(),
    returnOrigin: z.string().optional(),
    returnDestination: z.string().optional(),
    returnFlight: z.string().optional(),
    returnDriverId: z.coerce.number().int().optional(),
    returnVehicleId: z.coerce.number().int().optional(),
    guide: z.string().optional(),
    passengers: z.coerce.number().int().min(0).optional(),
    bags: z.coerce.number().int().min(0).optional(),
    restanteMetodoDriver: z.enum(paymentMethodEnum).nullable().optional(),
    paxAdt: z.coerce.number().int().min(0).optional(),
    paxChd: z.coerce.number().int().min(0).optional(),
    paxInf: z.coerce.number().int().min(0).optional(),
    paxSen: z.coerce.number().int().min(0).optional(),
    paxFree: z.coerce.number().int().min(0).optional(),
  });
// Inserts dos novos schemas financeiros
export const insertVehicleKmLogSchema = createInsertSchema(vehicleKmLogs).omit({ id: true, createdAt: true });
export const insertVehicleExpenseSchema = createInsertSchema(vehicleExpenses).omit({ id: true, createdAt: true });
export const insertCompanyExpenseSchema = createInsertSchema(companyExpenses).omit({ id: true, createdAt: true });
export const insertDriverPaymentSchema = createInsertSchema(driverPayments).omit({ id: true, createdAt: true });
export const insertCompanyRevenueSchema = createInsertSchema(companyRevenues).omit({ id: true, createdAt: true });

// --- Types ---

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type ClientDependent = typeof clientDependents.$inferSelect;
export type InsertClientDependent = z.infer<typeof insertClientDependentSchema>;

export type ClientWithDependents = Client & {
  dependents: ClientDependent[];
};

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type DriverPushToken = typeof driverPushTokens.$inferSelect;
export type InsertDriverPushToken = z.infer<typeof insertDriverPushTokenSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type CompanyRevenue = typeof companyRevenues.$inferSelect;
export type InsertCompanyRevenue = z.infer<typeof insertCompanyRevenueSchema>;

export type ServiceWithDetails = Service & {
  driver?: Driver | null;
  vehicle?: Vehicle | null;
  client?: Client | null;
};

export const insertUserInvitationSchema = createInsertSchema(userInvitations).omit({ 
  id: true, 
  token: true, 
  expiresAt: true, 
  used: true, 
  createdAt: true 
});

export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = z.infer<typeof insertUserInvitationSchema>;

// Novo schema para criação de usuário pendente pelo Admin
export const adminCreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(["admin", "operational", "driver"]),
});

export type AdminCreateUser = z.infer<typeof adminCreateUserSchema>;

// Schema para registro de senha
export const registerPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type RegisterPassword = z.infer<typeof registerPasswordSchema>;

// Schema para reset de senha via token
export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(6),
});
export type ResetPassword = z.infer<typeof resetPasswordSchema>;

// --- Campos calculáveis (não armazenados) ---
// Uso: em selects, incluir as colunas abaixo via sql e alias.
export const serviceFinanceComputed = {
  // Soma de todos os custos em centavos
  custoTotalViagem: sql<number>`
    coalesce(${services.combustivel}, 0)
    + coalesce(${services.pedagio}, 0)
    + coalesce(${services.estacionamento}, 0)
    + coalesce(${services.alimentacao}, 0)
    + coalesce(${services.outrosCustos}, 0)
  `,
  // Lucro bruto: valor cobrado - custo total (em centavos)
  lucroBrutoViagem: sql<number>`
    coalesce(${services.valorCobrado}, 0)
    - (
      coalesce(${services.combustivel}, 0)
      + coalesce(${services.pedagio}, 0)
      + coalesce(${services.estacionamento}, 0)
      + coalesce(${services.alimentacao}, 0)
      + coalesce(${services.outrosCustos}, 0)
    )
  `,
};

export type ServiceWithFinance = Service & {
  custoTotalViagem: number;
  lucroBrutoViagem: number;
};
