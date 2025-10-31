import { Request, Response } from 'express';
import { signUp, signIn } from '../services/authService';

export async function handleSignUp(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const result = await signUp({ username, email, password });
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign up failed';
    res.status(400).json({ error: message });
  }
}

export async function handleSignIn(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const result = await signIn({ email, password });
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign in failed';
    res.status(401).json({ error: message });
  }
}
