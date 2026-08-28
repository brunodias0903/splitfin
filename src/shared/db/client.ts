import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const createClient = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to access PostgreSQL.");
  }

  return postgres(databaseUrl, {
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    prepare: false,
  });
};

type SqlClient = ReturnType<typeof createClient>;
type Database = ReturnType<typeof drizzle<typeof schema>>;

const globalForDatabase = globalThis as typeof globalThis & {
  splitfinDatabase?: Database;
  splitfinSqlClient?: SqlClient;
};

export const getDatabase = (): Database => {
  if (!globalForDatabase.splitfinSqlClient) {
    globalForDatabase.splitfinSqlClient = createClient();
  }

  if (!globalForDatabase.splitfinDatabase) {
    globalForDatabase.splitfinDatabase = drizzle(globalForDatabase.splitfinSqlClient, { schema });
  }

  return globalForDatabase.splitfinDatabase;
};

export const closeDatabase = async () => {
  await globalForDatabase.splitfinSqlClient?.end();
  globalForDatabase.splitfinSqlClient = undefined;
  globalForDatabase.splitfinDatabase = undefined;
};

export type { Database };
