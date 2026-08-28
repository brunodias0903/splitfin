CREATE TYPE "public"."account_type" AS ENUM('checking', 'savings', 'cash', 'investment', 'other');--> statement-breakpoint
CREATE TYPE "public"."card_type" AS ENUM('credit', 'debit', 'multiple');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('cash', 'debit_card', 'credit_card', 'bank_transfer', 'pix', 'other');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" NOT NULL,
	"currency" varchar(3) DEFAULT 'BRL' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_currency_iso_4217" CHECK ("accounts"."currency" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid,
	"name" text NOT NULL,
	"last_four_digits" varchar(4) NOT NULL,
	"type" "card_type" DEFAULT 'credit' NOT NULL,
	"closing_day" integer NOT NULL,
	"due_day" integer NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cards_last_four_digits_format" CHECK ("cards"."last_four_digits" ~ '^[0-9]{4}$'),
	CONSTRAINT "cards_closing_day_range" CHECK ("cards"."closing_day" between 1 and 31),
	CONSTRAINT "cards_due_day_range" CHECK ("cards"."due_day" between 1 and 31)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_format" CHECK ("categories"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid,
	"card_id" uuid,
	"category_id" uuid,
	"installment_plan_id" uuid,
	"installment_number" integer,
	"description" text NOT NULL,
	"amount_cents" bigint NOT NULL,
	"payment_type" "payment_type" NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_positive_amount" CHECK ("expenses"."amount_cents" > 0),
	CONSTRAINT "expenses_installment_consistency" CHECK (("expenses"."installment_plan_id" is null and "expenses"."installment_number" is null) or ("expenses"."installment_plan_id" is not null and "expenses"."installment_number" > 0))
);
--> statement-breakpoint
CREATE TABLE "installment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" uuid,
	"category_id" uuid,
	"description" text NOT NULL,
	"total_amount_cents" bigint NOT NULL,
	"total_installments" integer NOT NULL,
	"paid_installments" integer DEFAULT 0 NOT NULL,
	"starts_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "installment_plans_positive_amount" CHECK ("installment_plans"."total_amount_cents" > 0),
	CONSTRAINT "installment_plans_total_range" CHECK ("installment_plans"."total_installments" between 2 and 999),
	CONSTRAINT "installment_plans_paid_range" CHECK ("installment_plans"."paid_installments" between 0 and "installment_plans"."total_installments")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_installment_plan_id_installment_plans_id_fk" FOREIGN KEY ("installment_plan_id") REFERENCES "public"."installment_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_user_name_unique" ON "accounts" USING btree ("user_id",lower("name")) WHERE "accounts"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "cards_user_id_idx" ON "cards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cards_account_id_idx" ON "cards" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "categories_user_id_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_slug_unique" ON "categories" USING btree ("user_id","slug") WHERE "categories"."user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_system_slug_unique" ON "categories" USING btree ("slug") WHERE "categories"."user_id" is null;--> statement-breakpoint
CREATE INDEX "expenses_user_occurred_at_idx" ON "expenses" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "expenses_account_id_idx" ON "expenses" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "expenses_card_id_idx" ON "expenses" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "expenses_category_id_idx" ON "expenses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "expenses_installment_plan_id_idx" ON "expenses" USING btree ("installment_plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "expenses_installment_number_unique" ON "expenses" USING btree ("installment_plan_id","installment_number") WHERE "expenses"."installment_plan_id" is not null;--> statement-breakpoint
CREATE INDEX "installment_plans_user_id_idx" ON "installment_plans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "installment_plans_card_id_idx" ON "installment_plans" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "installment_plans_category_id_idx" ON "installment_plans" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));