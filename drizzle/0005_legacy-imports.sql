CREATE TABLE "legacy_import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"idempotency_key" varchar(64) NOT NULL,
	"imported_cards" integer DEFAULT 0 NOT NULL,
	"imported_expenses" integer DEFAULT 0 NOT NULL,
	"imported_installments" integer DEFAULT 0 NOT NULL,
	"skipped_items" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legacy_import_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"source_kind" varchar(24) NOT NULL,
	"source_id" text NOT NULL,
	"target_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "legacy_import_batches" ADD CONSTRAINT "legacy_import_batches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legacy_import_items" ADD CONSTRAINT "legacy_import_items_batch_id_legacy_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."legacy_import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legacy_import_items" ADD CONSTRAINT "legacy_import_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "legacy_import_batches_user_key_unique" ON "legacy_import_batches" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "legacy_import_batches_user_id_idx" ON "legacy_import_batches" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "legacy_import_items_user_source_unique" ON "legacy_import_items" USING btree ("user_id","source_kind","source_id");--> statement-breakpoint
CREATE INDEX "legacy_import_items_batch_id_idx" ON "legacy_import_items" USING btree ("batch_id");