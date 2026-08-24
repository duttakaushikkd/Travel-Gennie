import { compare, hash } from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo";

const PASSWORD_ROUNDS = 12;

export type UserRecord = {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createUser(email: string, password: string): Promise<{ email: string; userId: string }> {
  const normalized = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Enter a valid email address.");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const db = await getDb();
  const existing = await db.collection<UserRecord>("users").findOne({ email: normalized });
  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  const passwordHash = await hash(password, PASSWORD_ROUNDS);
  const userId = new ObjectId();
  await db.collection<UserRecord>("users").insertOne({
    _id: userId,
    email: normalized,
    passwordHash,
    createdAt: new Date(),
  });

  return { email: normalized, userId: userId.toHexString() };
}

export async function verifyUser(email: string, password: string): Promise<{ email: string; userId: string }> {
  const db = await getDb();
  const user = await db.collection<UserRecord>("users").findOne({ email: normalizeEmail(email) });
  if (!user) {
    throw new Error("Email or password is incorrect.");
  }
  const ok = await compare(password, user.passwordHash);
  if (!ok) {
    throw new Error("Email or password is incorrect.");
  }
  return { email: user.email, userId: user._id.toHexString() };
}
