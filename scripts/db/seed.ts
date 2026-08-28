import { closeDatabase, getDatabase } from "../../src/shared/db/client";
import { accounts, categories, users } from "../../src/shared/db/schema";

const developmentUserId = "00000000-0000-4000-8000-000000000001";

const database = getDatabase();

try {
  await database.transaction(async (transaction) => {
    await transaction
      .insert(users)
      .values({
        id: developmentUserId,
        email: "dev@splitfin.local",
        name: "Usuário local",
      })
      .onConflictDoNothing();

    await transaction
      .insert(accounts)
      .values({
        id: "00000000-0000-4000-8000-000000000002",
        userId: developmentUserId,
        name: "Conta principal",
        type: "checking",
      })
      .onConflictDoNothing();

    await transaction
      .insert(categories)
      .values([
        {
          id: "00000000-0000-4000-8000-000000000010",
          name: "Alimentação",
          slug: "alimentacao",
          colorToken: "warning",
        },
        {
          id: "00000000-0000-4000-8000-000000000011",
          name: "Moradia",
          slug: "moradia",
          colorToken: "primary",
        },
        {
          id: "00000000-0000-4000-8000-000000000012",
          name: "Transporte",
          slug: "transporte",
          colorToken: "info",
        },
      ])
      .onConflictDoNothing();
  });

  console.info("Seed de desenvolvimento aplicado.");
} finally {
  await closeDatabase();
}
