CREATE TABLE "auth_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"outcome" text DEFAULT 'success' NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"request_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "security_audit_events" ADD CONSTRAINT "security_audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "security_audit_actor_created_at_idx" ON "security_audit_events" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "security_audit_action_created_at_idx" ON "security_audit_events" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "security_audit_created_at_idx" ON "security_audit_events" USING btree ("created_at");