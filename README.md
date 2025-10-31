# AlgoLounge

AlgoLounge is a full-stack interactive coding practice platform where developers can sharpen their algorithmic thinking and problem-solving skills through hands-on programming challenges and structured courses.

## Features

- 🧩 **Interactive Coding Challenges** - Practice with real programming problems
- 📚 **Structured Courses** - Learn through guided learning paths
- 🌙 **Dark Mode Support** - Comfortable coding in any lighting
- ✅ **Progress Tracking** - Keep track of completed challenges
- 💾 **Local Storage** - Your progress is saved locally
- 🔐 **User Authentication** - Create accounts and sync progress across devices
- ☁️ **Cloud Sync** - Favorite courses and progress synced to backend

## Tech Stack

### Frontend
- Angular 19.2
- TypeScript
- SCSS
- CodeMirror for code editing
- PrimeNG UI components

### Backend
- Express.js with TypeScript
- SQLite with Drizzle ORM
- JWT Authentication
- RESTful API

## Quick Start

### Initial Setup (One-time)
```bash
./setup
```

This will:
- Install dependencies for both frontend and backend
- Set up the SQLite database
- Run migrations

### Start Development
```bash
./start
```

This starts both servers:
- **Frontend**: http://localhost:4200 (Angular with hot reload)
- **Backend**: http://localhost:3000 (Express API with hot reload)

Press `Ctrl+C` to stop both servers gracefully.

## Project Structure

```
algolounge.com/
├── frontend/              Angular 19.2 application
├── backend/               Express.js API server
├── setup                  Initial setup script
├── start                  Development launcher script
└── README.md             Project documentation
```

## Frontend Development

### Start Dev Server
```bash
cd frontend
npm start
```

Or from root:
```bash
./start
```

### Build for Production
```bash
cd frontend
ng build
```

Build output goes to `../backend/public/` for Express to serve.

### Other Commands
```bash
cd frontend
ng generate component component-name  # Generate new component
ng test                              # Run tests
npm run sync-index                  # Sync question/course indices
```

## Backend Development

### Start Dev Server with Hot Reload
```bash
cd backend
npm run dev
```

Or from root:
```bash
./start
```

### Database Commands
```bash
cd backend
npm run db:generate   # Generate migrations after schema changes
npm run db:push       # Apply migrations
npm run db:studio     # Open Drizzle Studio to view database
```

### API Endpoints

**Authentication**
- `POST /api/auth/signup` - Create account (username, email, password)
- `POST /api/auth/signin` - Login (email, password)

**Favorite Courses (Protected)**
- `GET /api/favorites` - Get user's favorite courses
- `POST /api/favorites` - Add course to favorites
- `DELETE /api/favorites` - Remove course from favorites

All protected endpoints require `Authorization: Bearer <token>` header.

## Environment Configuration

### Local Development (Default)
No setup needed. Automatically uses:
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`

### Production
Set environment variables before running:
```bash
PORT=8080 BACKEND_PORT_API=3001 ./start
```

Or create `.env` files in `frontend/` and `backend/` directories.

## Database

- **Type**: SQLite
- **ORM**: Drizzle
- **Location**: `backend/algolounge.db` (local dev)

### Schema
- **users** table: id, username, email, passwordHash, createdAt, updatedAt
- **favorite_courses** table: id, userId, courseFilename, createdAt

## Authentication

- **Method**: JWT (JSON Web Tokens)
- **Expiration**: 30 days
- **Algorithm**: HS256
- **Password Hashing**: bcryptjs

## Next Steps

To fully integrate authentication and favorites with the frontend:

1. Create `AuthService` for signup/signin/logout
2. Create `FavoriteCoursesService` for managing favorites
3. Add HTTP interceptor for JWT tokens
4. Build Sign Up/Sign In UI components
5. Update Courses page to sync with backend
6. Add user info display in header

See `backend/README.md` for more details on API development.

## Troubleshooting

### Port Already in Use
```bash
lsof -i :3000    # Find process on port 3000
kill -9 <PID>    # Kill the process
```

### Database Issues
```bash
cd backend
rm -f *.db *.db-shm *.db-wal
npm run db:push
```

### Dependency Issues
```bash
./setup
```

## Additional Resources

- **Backend Docs**: See `backend/README.md`
- **Angular CLI**: https://angular.dev/tools/cli
- **Drizzle ORM**: https://orm.drizzle.team/
- **Express.js**: https://expressjs.com/

