ALTER TYPE "public"."payment_type" ADD VALUE 'boleto' BEFORE 'pix';--> statement-breakpoint
INSERT INTO "categories" ("id", "user_id", "name", "slug", "color_token") VALUES
  ('00000000-0000-4000-8000-000000000101', NULL, 'Alimentação', 'food', 'category-food'),
  ('00000000-0000-4000-8000-000000000102', NULL, 'Transporte', 'transport', 'category-transport'),
  ('00000000-0000-4000-8000-000000000103', NULL, 'Entretenimento', 'entertainment', 'category-entertainment'),
  ('00000000-0000-4000-8000-000000000104', NULL, 'Compras', 'shopping', 'category-shopping'),
  ('00000000-0000-4000-8000-000000000105', NULL, 'Contas', 'bills', 'category-bills'),
  ('00000000-0000-4000-8000-000000000106', NULL, 'Assinaturas', 'subscription', 'primary'),
  ('00000000-0000-4000-8000-000000000107', NULL, 'Outros', 'other', 'muted')
ON CONFLICT DO NOTHING;
