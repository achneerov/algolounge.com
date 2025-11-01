# AlgoLounge

AlgoLounge is a full-stack interactive coding practice platform where developers can sharpen their algorithmic thinking and problem-solving skills through hands-on programming challenges and structured courses. Features a modern Angular frontend with an Express.js backend powered by SQLite.

## Features

- 🧩 **Interactive Coding Challenges** - Practice with real programming problems in Python, JavaScript, TypeScript, and Java
- 📚 **Structured Courses** - Learn through guided learning paths
- 🔐 **User Authentication** - Register and login to sync progress across devices
- ⭐ **Favorites System** - Save your favorite courses for quick access
- 🌙 **Dark Mode Support** - Comfortable coding in any lighting
- ✅ **Progress Tracking** - Keep track of completed challenges (local + cloud)
- 💾 **Offline First** - Works locally, syncs when authenticated

## Tech Stack

**Frontend:**
- Angular 19.2
- TypeScript
- PrimeNG UI components
- CodeMirror for code editing
- RxJS for state management

**Backend:**
- Express.js
- SQLite with Drizzle ORM
- JWT authentication with bcryptjs
- CORS support

## Quick Start

### Prerequisites
- Node.js 22+ (or compatible version)
- npm

### Setup (First Time Only)

```bash
./setup
```

This will:
1. Pull latest code from git
2. Install dependencies for both frontend and backend
3. Initialize the SQLite database
4. Generate environment configuration files
5. Build the Angular app for production (if using `./setup -prod`)

### Development Mode

```bash
./setup          # First time only
./start          # Starts both servers
```

Then open http://localhost:4200 in your browser.

- **Frontend:** http://localhost:4200 (Angular dev server)
- **Backend:** http://localhost:3000 (Express API)

### Production Mode

```bash
./setup -prod    # Setup for production
./start          # Runs both servers with production config
```

In production mode:
- Angular is built and served from the backend
- Both frontend and API run on the same port (3000)
- Environment variables control API URLs and CORS

## Project Structure

```
algolounge/
├── frontend/                 # Angular 19.2 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/     # Auth, Favorites services
│   │   │   ├── interceptors/ # HTTP interceptor for JWT
│   │   │   ├── environments/ # Generated env config
│   │   │   └── ...
│   │   └── main.ts
│   ├── package.json
│   └── angular.json
│
├── backend/                  # Express.js server
│   ├── src/
│   │   ├── db/               # Drizzle ORM schema
│   │   ├── services/         # Auth, Favorites business logic
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # JWT auth middleware
│   │   └── index.ts          # Express server
│   ├── database.db           # SQLite database (auto-created)
│   ├── package.json
│   └── .env.local            # Generated env config
│
├── setup                     # Setup script (dev/prod)
├── start                     # Start both servers
└── README.md
```

## Authentication Flow

### Registration
1. User fills registration form (username, email, password)
2. Frontend sends POST to `/api/auth/signup`
3. Backend hashes password with bcryptjs, creates user in database
4. Backend returns JWT token and user info
5. Frontend stores token in localStorage
6. Token is auto-attached to all subsequent requests via interceptor

### Login
1. User enters email and password
2. Frontend sends POST to `/api/auth/signin`
3. Backend verifies credentials, generates JWT token
4. Token stored in localStorage and used for API calls

### Protected Routes
- All API endpoints except `/api/auth/signup` and `/api/auth/signin` require JWT token
- Token sent via `Authorization: Bearer <token>` header
- Backend validates token and extracts user ID
- Invalid/expired tokens return 401 Unauthorized

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
  - Body: `{ username, email, password }`
  - Returns: `{ user: { id, username, email }, token }`

- `POST /api/auth/signin` - Login user
  - Body: `{ email, password }`
  - Returns: `{ user: { id, username, email }, token }`

### Favorites (Requires Auth)
- `GET /api/favorites` - Get user's favorite courses
  - Returns: `{ favorites: [courseFilename, ...] }`

- `POST /api/favorites` - Add favorite course
  - Body: `{ courseFilename }`
  - Returns: Created favorite object

- `DELETE /api/favorites` - Remove favorite course
  - Body: `{ courseFilename }`
  - Returns: `{ success: true }`

### Health Check
- `GET /api/health` - Server status
  - Returns: `{ status: "ok", environment: "development" | "production" }`

## Environment Configuration

### Development (.env.local is auto-generated)
```
NODE_ENV=development
JWT_SECRET=<auto-generated>
PORT=3000
CORS_ORIGIN=http://localhost:4200
```

### Production (.env.local is auto-generated)
```
NODE_ENV=production
JWT_SECRET=<persisted from first setup>
PORT=3000
CORS_ORIGIN=<your-domain>
```

**Important:** JWT_SECRET is generated once and persisted. It's never regenerated to prevent logging out all users.

## Frontend Environment (Auto-generated)

### Development (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

### Production (environment.ts)
```typescript
export const environment = {
  production: true,
  apiUrl: '' // Empty = same origin
};
```

## Development Commands

### Frontend
```bash
cd frontend

npm start              # Development server (ng serve)
npm run build          # Production build
npm test               # Run tests
npm run sync-index     # Update question/course indices
```

### Backend
```bash
cd backend

npm run dev            # Development server with hot reload (tsx watch)
npm run db:generate    # Generate database migrations
npm run db:migrate     # Run database migrations
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch() * 1000),
  updated_at INTEGER DEFAULT (unixepoch() * 1000)
);
```

### Favorite Courses Table
```sql
CREATE TABLE favorite_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_filename TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, course_filename)
);
```

## Offline-First Architecture

The frontend uses an offline-first approach:

1. **Local Storage**: Questions and course progress stored in localStorage
2. **API Sync**: When authenticated, user progress syncs with backend
3. **Fallback**: If backend is unavailable, local storage is used
4. **Remote as Source of Truth**: When user logs in, backend favorites become the authoritative list

## Troubleshooting

### Setup fails to run
```bash
chmod +x ./setup ./start
./setup
```

### Backend won't connect to frontend
- Check if port 3000 is available
- Verify `.env.local` exists in backend folder
- Check CORS_ORIGIN setting in .env.local

### JWT Token expiration
- Token expires after 30 days
- User will need to log in again
- Can reset JWT by re-running `./setup` (regenerates secret)

### Database errors
```bash
cd backend
npm run db:migrate     # Reinitialize database
```

## License

MIT
