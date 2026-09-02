import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const accountType = pgEnum("account_type", [
  "checking",
  "savings",
  "cash",
  "investment",
  "other",
]);

export const cardType = pgEnum("card_type", ["credit", "debit", "multiple"]);

export const paymentType = pgEnum("payment_type", [
  "cash",
  "debit_card",
  "credit_card",
  "bank_transfer",
  "boleto",
  "pix",
  "other",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_unique").on(sql`lower(${table.email})`)],
);

export const authIdentities = pgTable(
  "auth_identities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: text("provider_id").notNull(),
    issuer: text("issuer").notNull(),
    accountId: text("account_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("auth_identities_issuer_account_unique").on(table.issuer, table.accountId),
    index("auth_identities_user_id_idx").on(table.userId),
  ],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("auth_sessions_token_unique").on(table.token),
    index("auth_sessions_user_id_idx").on(table.userId),
    index("auth_sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const authVerifications = pgTable(
  "auth_verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("auth_verifications_identifier_idx").on(table.identifier),
    index("auth_verifications_expires_at_idx").on(table.expiresAt),
  ],
);

export const authRateLimits = pgTable("auth_rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const securityAuditEvents = pgTable(
  "security_audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    outcome: text("outcome").default("success").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    requestId: text("request_id"),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("security_audit_actor_created_at_idx").on(table.actorUserId, table.createdAt),
    index("security_audit_action_created_at_idx").on(table.action, table.createdAt),
    index("security_audit_created_at_idx").on(table.createdAt),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: accountType("type").notNull(),
    currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("accounts_user_id_idx").on(table.userId),
    uniqueIndex("accounts_user_name_unique")
      .on(table.userId, sql`lower(${table.name})`)
      .where(sql`${table.archivedAt} is null`),
    check("accounts_currency_iso_4217", sql`${table.currency} ~ '^[A-Z]{3}$'`),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    colorToken: text("color_token").notNull(),
    ...timestamps,
  },
  (table) => [
    index("categories_user_id_idx").on(table.userId),
    uniqueIndex("categories_user_slug_unique")
      .on(table.userId, table.slug)
      .where(sql`${table.userId} is not null`),
    uniqueIndex("categories_system_slug_unique")
      .on(table.slug)
      .where(sql`${table.userId} is null`),
    check("categories_slug_format", sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  ],
);

export const cards = pgTable(
  "cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    lastFourDigits: varchar("last_four_digits", { length: 4 }).notNull(),
    type: cardType("type").default("credit").notNull(),
    closingDay: integer("closing_day").notNull(),
    dueDay: integer("due_day").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("cards_user_id_idx").on(table.userId),
    index("cards_account_id_idx").on(table.accountId),
    check("cards_last_four_digits_format", sql`${table.lastFourDigits} ~ '^[0-9]{4}$'`),
    check("cards_closing_day_range", sql`${table.closingDay} between 1 and 31`),
    check("cards_due_day_range", sql`${table.dueDay} between 1 and 31`),
  ],
);

export const installmentPlans = pgTable(
  "installment_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: uuid("card_id").references(() => cards.id, { onDelete: "set null" }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    description: text("description").notNull(),
    totalAmountCents: bigint("total_amount_cents", { mode: "number" }).notNull(),
    totalInstallments: integer("total_installments").notNull(),
    paidInstallments: integer("paid_installments").default(0).notNull(),
    startsOn: date("starts_on", { mode: "string" }).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("installment_plans_user_id_idx").on(table.userId),
    index("installment_plans_card_id_idx").on(table.cardId),
    index("installment_plans_category_id_idx").on(table.categoryId),
    check("installment_plans_positive_amount", sql`${table.totalAmountCents} > 0`),
    check("installment_plans_total_range", sql`${table.totalInstallments} between 2 and 999`),
    check(
      "installment_plans_paid_range",
      sql`${table.paidInstallments} between 0 and ${table.totalInstallments}`,
    ),
  ],
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    cardId: uuid("card_id").references(() => cards.id, { onDelete: "set null" }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    installmentPlanId: uuid("installment_plan_id").references(() => installmentPlans.id, {
      onDelete: "cascade",
    }),
    installmentNumber: integer("installment_number"),
    description: text("description").notNull(),
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    paymentType: paymentType("payment_type").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("expenses_user_occurred_at_idx").on(table.userId, table.occurredAt),
    index("expenses_account_id_idx").on(table.accountId),
    index("expenses_card_id_idx").on(table.cardId),
    index("expenses_category_id_idx").on(table.categoryId),
    index("expenses_installment_plan_id_idx").on(table.installmentPlanId),
    uniqueIndex("expenses_installment_number_unique")
      .on(table.installmentPlanId, table.installmentNumber)
      .where(sql`${table.installmentPlanId} is not null`),
    check("expenses_positive_amount", sql`${table.amountCents} > 0`),
    check(
      "expenses_installment_consistency",
      sql`(${table.installmentPlanId} is null and ${table.installmentNumber} is null) or (${table.installmentPlanId} is not null and ${table.installmentNumber} > 0)`,
    ),
  ],
);

export const legacyImportBatches = pgTable(
  "legacy_import_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    idempotencyKey: varchar("idempotency_key", { length: 64 }).notNull(),
    importedCards: integer("imported_cards").default(0).notNull(),
    importedExpenses: integer("imported_expenses").default(0).notNull(),
    importedInstallments: integer("imported_installments").default(0).notNull(),
    skippedItems: integer("skipped_items").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("legacy_import_batches_user_key_unique").on(table.userId, table.idempotencyKey),
    index("legacy_import_batches_user_id_idx").on(table.userId),
  ],
);

export const legacyImportItems = pgTable(
  "legacy_import_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => legacyImportBatches.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceKind: varchar("source_kind", { length: 24 }).notNull(),
    sourceId: text("source_id").notNull(),
    targetId: uuid("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("legacy_import_items_user_source_unique").on(
      table.userId,
      table.sourceKind,
      table.sourceId,
    ),
    index("legacy_import_items_batch_id_idx").on(table.batchId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  authIdentities: many(authIdentities),
  authSessions: many(authSessions),
  accounts: many(accounts),
  cards: many(cards),
  categories: many(categories),
  expenses: many(expenses),
  installmentPlans: many(installmentPlans),
  securityAuditEvents: many(securityAuditEvents),
}));

export const authIdentitiesRelations = relations(authIdentities, ({ one }) => ({
  user: one(users, { fields: [authIdentities.userId], references: [users.id] }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, { fields: [authSessions.userId], references: [users.id] }),
}));

export const securityAuditEventsRelations = relations(securityAuditEvents, ({ one }) => ({
  actor: one(users, { fields: [securityAuditEvents.actorUserId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  cards: many(cards),
  expenses: many(expenses),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  expenses: many(expenses),
  installmentPlans: many(installmentPlans),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  user: one(users, { fields: [cards.userId], references: [users.id] }),
  account: one(accounts, { fields: [cards.accountId], references: [accounts.id] }),
  expenses: many(expenses),
  installmentPlans: many(installmentPlans),
}));

export const installmentPlansRelations = relations(installmentPlans, ({ one, many }) => ({
  user: one(users, { fields: [installmentPlans.userId], references: [users.id] }),
  card: one(cards, { fields: [installmentPlans.cardId], references: [cards.id] }),
  category: one(categories, {
    fields: [installmentPlans.categoryId],
    references: [categories.id],
  }),
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, { fields: [expenses.userId], references: [users.id] }),
  account: one(accounts, { fields: [expenses.accountId], references: [accounts.id] }),
  card: one(cards, { fields: [expenses.cardId], references: [cards.id] }),
  category: one(categories, { fields: [expenses.categoryId], references: [categories.id] }),
  installmentPlan: one(installmentPlans, {
    fields: [expenses.installmentPlanId],
    references: [installmentPlans.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AuthIdentity = typeof authIdentities.$inferSelect;
export type AuthSession = typeof authSessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type InstallmentPlan = typeof installmentPlans.$inferSelect;
