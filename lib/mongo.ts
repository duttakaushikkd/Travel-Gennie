import { type Db, MongoClient } from "mongodb";

type MongoCache = {
  client?: MongoClient;
  db?: Db;
  indexes?: Promise<void>;
};

const cache = globalThis as typeof globalThis & { __travelGennieMongo?: MongoCache };

function mongoCache(): MongoCache {
  cache.__travelGennieMongo ??= {};
  return cache.__travelGennieMongo;
}

function requireMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add your MongoDB connection string to .env.local.");
  }
  return uri;
}

export async function getDb(): Promise<Db> {
  const stored = mongoCache();
  if (!stored.client) {
    stored.client = new MongoClient(requireMongoUri());
    await stored.client.connect();
    stored.db = stored.client.db();
  }
  if (!stored.db) {
    throw new Error("MongoDB is not connected.");
  }
  stored.indexes ??= ensureIndexes(stored.db);
  await stored.indexes;
  return stored.db;
}

async function ensureIndexes(db: Db): Promise<void> {
  try {
    await db.collection("users").dropIndex("email_1");
  } catch {
    // Index may not exist on a fresh database.
  }
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("trips").createIndex({ userId: 1, updatedAt: -1 });
}
