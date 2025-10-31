# AlgoLounge Backend API

Express.js + Drizzle ORM backend for AlgoLounge.

## Tech Stack

- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **Database**: SQLite with Drizzle ORM
- **Language**: TypeScript
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Development**: tsx with watch mode

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file (or copy from `.env.example`):

```
PORT=3000
DATABASE_URL=./algolounge.db
JWT_SECRET=dev-secret-key-change-in-prod
```

### Development

Start the development server with hot reload:

```bash
npm run dev
```

Server will run on http://localhost:3000

## Scripts

```bash
npm run dev          # Start development server with hot reload (tsx watch)
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled JavaScript
npm run db:generate  # Generate migrations after schema changes
npm run db:migrate   # Run migrations
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio to view/edit database
```

## Project Structure

```
src/
├── controllers/              Route handlers
│   ├── authController.ts    Sign up/sign in handlers
│   └── favoriteCoursesController.ts
├── services/                 Business logic
│   ├── authService.ts       User auth logic
│   └── favoriteCoursesService.ts
├── models/                   Drizzle ORM schemas
│   ├── users.ts
│   ├── favoriteCourses.ts
│   └── index.ts
├── db/                       Database related
│   ├── index.ts             Database instance
│   └── migrations/          Auto-generated migration files
├── middleware/               Express middleware
│   └── auth.ts              JWT verification middleware
└── index.ts                 Express app entry point
```

## API Routes

### Authentication

```
POST /api/auth/signup     Create new account
POST /api/auth/signin     Login user
```

### Favorite Courses (Protected)

```
GET    /api/favorites     Get user's favorite courses
POST   /api/favorites     Add course to favorites
DELETE /api/favorites     Remove course from favorites
```

All favorite courses endpoints require `Authorization: Bearer <token>` header.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Favorite Courses Table
```sql
CREATE TABLE favorite_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_filename TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Authentication

### Token Generation

- **Algorithm**: HS256
- **Expiration**: 30 days
- **Secret**: Set via JWT_SECRET environment variable

### Token Usage

Include JWT token in request headers:

```
Authorization: Bearer <your_jwt_token_here>
```

The auth middleware will:
1. Extract token from Authorization header
2. Verify token signature and expiration
3. Attach user ID to request object as `req.userId`

## Adding New Features

### Adding a New Model

1. Create schema in `src/models/yourModel.ts`:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const yourTable = sqliteTable('your_table', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
```

2. Export from `src/models/index.ts`

3. Generate migration:
```bash
npm run db:generate
```

4. Apply migration:
```bash
npm run db:push
```

### Adding a New Route

1. Create service in `src/services/yourService.ts`
2. Create controller in `src/controllers/yourController.ts`
3. Import and add route in `src/index.ts`:

```typescript
app.post('/api/your-route', yourController);
```

## Error Handling

Standard error responses:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token or credentials
- `500 Internal Server Error` - Server error

## Development Tips

### Hot Reload

The `npm run dev` command uses `tsx watch` which automatically restarts on file changes.

### Database Queries

Using Drizzle:

```typescript
// Select
const users = await db.select().from(users).where(eq(users.id, 1));

// Insert
const result = await db.insert(users).values({ ... }).returning();

// Update
await db.update(users).set({ ... }).where(eq(users.id, 1));

// Delete
await db.delete(users).where(eq(users.id, 1));
```

### Testing Endpoints

Use any HTTP client:

```bash
# Using curl
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password"}'

# Using Postman
# Import the API endpoints and test
```

## Production Deployment

1. Set strong `JWT_SECRET` in production environment
2. Use a production-ready database (SQLite is fine for smaller deployments)
3. Enable CORS if frontend is on different domain
4. Set appropriate security headers
5. Use HTTPS in production
6. Monitor error logs and performance

### Environment Variables for Production

```
PORT=3000
DATABASE_URL=/path/to/production.db
JWT_SECRET=your-strong-production-secret
NODE_ENV=production
```

## Troubleshooting

### Port Already in Use

```bash
lsof -i :3000
kill -9 <PID>
```

### Database Locked

SQLite locks files during writes. If issues persist:

```bash
# Delete lock files
rm -f *.db-shm *.db-wal

# Reset database
npm run db:push
```

### Module Import Errors

Ensure `"type": "module"` is set in `package.json` for ES module support.

