import { db, users } from "../db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret";
const JWT_EXPIRY = "30d";

export interface JWTPayload {
  userId: number;
  email: string;
  roleId: number;
}

export async function registerUser(
  username: string,
  email: string,
  password: string
) {
  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("Email already registered");
  }

  const existingUsername = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existingUsername.length > 0) {
    throw new Error("Username already taken");
  }

  // Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const result = await db
    .insert(users)
    .values({
      username,
      email,
      passwordHash,
      roleId: 2, // Default to 'member' role
    })
    .returning();

  const newUser = result[0];

  // Generate JWT
  const token = generateToken({
    userId: newUser.id,
    email: newUser.email,
    roleId: newUser.roleId,
  });

  return {
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      roleId: newUser.roleId,
    },
    token,
  };
}

export async function loginUser(emailOrUsername: string, password: string) {
  // Find user by email or username
  let result = await db
    .select()
    .from(users)
    .where(eq(users.email, emailOrUsername))
    .limit(1);

  // If not found by email, try username
  if (result.length === 0) {
    result = await db
      .select()
      .from(users)
      .where(eq(users.username, emailOrUsername))
      .limit(1);
  }

  if (result.length === 0) {
    throw new Error("Invalid email/username or password");
  }

  const user = result[0];

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid email/username or password");
  }

  // Generate JWT
  const token = generateToken({
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
    },
    token,
  };
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getUserById(userId: number) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0] || null;
}
