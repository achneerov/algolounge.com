import { Router, Request, Response } from "express";
import { db, users, userRoles } from "../db";
import { eq, like, or, sql } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middleware/auth";

const router = Router();

// GET /api/admin/users - Get all users (admin only)
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const allUsers = await db.select().from(users);
      // Remove password hash for security
      const safeUsers = allUsers.map(user => {
        const { passwordHash, ...rest } = user as any;
        return rest;
      });
      res.json(safeUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/admin/users/search - Search users by username or email (admin only)
router.get(
  "/users/search",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: "Search query required" });
      }

      const searchResults = await db
        .select()
        .from(users)
        .where(
          or(
            sql`LOWER(${users.username}) LIKE LOWER(${`%${query}%`})`,
            sql`LOWER(${users.email}) LIKE LOWER(${`%${query}%`})`
          )
        );

      // Remove password hash for security
      const safeUsers = searchResults.map(user => {
        const { passwordHash, ...rest } = user as any;
        return rest;
      });

      res.json(safeUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/admin/users/:id - Get single user by ID (admin only)
router.get(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Remove password hash
      const { passwordHash, ...safeUser } = user[0] as any;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PATCH /api/admin/users/:id - Update user (admin only)
router.patch(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, roleId } = req.body;

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Check if user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Build update object - only include fields that were provided
      const updateData: Record<string, any> = {};
      if (username !== undefined) {
        updateData.username = username;
      }
      if (roleId !== undefined) {
        updateData.roleId = roleId;
      }
      updateData.updatedAt = Math.floor(Date.now());

      if (Object.keys(updateData).length === 1 && updateData.updatedAt) {
        // Nothing to update except timestamp
        const { passwordHash, ...safeUser } = existingUser[0] as any;
        return res.json(safeUser);
      }

      // Update user
      const updated = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (updated.length === 0) {
        return res.status(500).json({ error: "Failed to update user" });
      }

      // Remove password hash
      const { passwordHash, ...safeUser } = updated[0] as any;
      res.json(safeUser);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
