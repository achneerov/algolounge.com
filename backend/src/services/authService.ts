import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../models';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';
const JWT_EXPIRES_IN = '30d';

export interface SignUpData {
  username: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export async function signUp(data: SignUpData): Promise<AuthResponse> {
  // Check if user exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create user
  const result = await db
    .insert(users)
    .values({
      username: data.username,
      email: data.email,
      passwordHash,
    })
    .returning();

  const newUser = result[0];
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    },
  };
}

export async function signIn(data: SignInData): Promise<AuthResponse> {
  // Find user
  const userResults = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (userResults.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = userResults[0];

  // Verify password
  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  };
}

export function verifyToken(token: string): { id: number; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string };
  } catch {
    return null;
  }
}
