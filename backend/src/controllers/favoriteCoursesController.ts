import { Request, Response } from 'express';
import {
  getFavoriteCourses,
  addFavoriteCourse,
  removeFavoriteCourse,
} from '../services/favoriteCoursesService';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export async function handleGetFavorites(req: Request, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const favorites = await getFavoriteCourses(req.userId);
    res.json({ favorites });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get favorites';
    res.status(500).json({ error: message });
  }
}

export async function handleAddFavorite(req: Request, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { courseFilename } = req.body;
    if (!courseFilename) {
      res.status(400).json({ error: 'courseFilename required' });
      return;
    }

    await addFavoriteCourse(req.userId, courseFilename);
    res.status(201).json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add favorite';
    res.status(500).json({ error: message });
  }
}

export async function handleRemoveFavorite(req: Request, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { courseFilename } = req.body;
    if (!courseFilename) {
      res.status(400).json({ error: 'courseFilename required' });
      return;
    }

    await removeFavoriteCourse(req.userId, courseFilename);
    res.status(200).json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove favorite';
    res.status(500).json({ error: message });
  }
}
