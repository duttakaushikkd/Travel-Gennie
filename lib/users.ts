import { compare, hash } from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo";

const PASSWORD_ROUNDS = 10;

export type UserRecord = {
  _id: ObjectId;
  createdAt: Date;
  passwordHash: string;
  username: string;
};

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function validateUsername(username: string): string {
  const normalized = normalizeUsername(username);
  if (!/^[a-z0-9_]{3,32}$/.test(normalized)) {
    throw new Error("Username must be 3–32 letters, numbers, or underscores.");
  }
  return normalized;
}

export async function createUser(
  username: string,
  password: string,
): Promise<{ userId: string; username: string }> {
  const normalized = validateUsername(username);
  if (password.length < 4) {
    throw new Error("Password must be at least 4 characters.");
  }

  const db = await getDb();
  const existing = await db.collection<UserRecord>("users").findOne({ username: normalized });
  if (existing) {
    throw new Error("That username is already taken.");
  }

  const userId = new ObjectId();
  await db.collection<UserRecord>("users").insertOne({
    _id: userId,
    createdAt: new Date(),
    passwordHash: await hash(password, PASSWORD_ROUNDS),
    username: normalized,
  });

  return { userId: userId.toHexString(), username: normalized };
}

export async function verifyUser(
  username: string,
  password: string,
): Promise<{ userId: string; username: string }> {
  const db = await getDb();
  const user = await db.collection<UserRecord>("users").findOne({
    username: normalizeUsername(username),
  });
  if (!user || !(await compare(password, user.passwordHash))) {
    throw new Error("Username or password is incorrect.");
  }
  return { userId: user._id.toHexString(), username: user.username };
}
