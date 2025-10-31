# AlgoLounge Full-Stack Setup

This project has been restructured into a full-stack application with separate frontend and backend.

## Project Structure

```
algolounge.com/
├── frontend/           Angular 19.2 application
├── backend/            Express.js + Drizzle ORM API
├── setup               Shell script for initial setup
├── start               Shell script to start development servers
└── plan.txt            Architecture plan and requirements
```

## Quick Start

### Initial Setup (One-time)

```bash
./setup
```

This script will:
- Git pull latest changes
- Install dependencies for both frontend and backend
- Clean up and rebuild the SQLite database based on migrations
- Run Drizzle migrations

### Start Development Servers

```bash
./start
```

This starts both servers:
- **Frontend**: http://localhost:4200 (Angular)
- **Backend**: http://localhost:3000 (Express API)

Both servers have hot reload enabled. Press `Ctrl+C` to stop both servers gracefully.

### Environment Variables

**Local Development (Default)**
- No environment variables needed
- Frontend: `localhost:4200`
- Backend: `localhost:3000`

**Production Mode**
- Set `PORT` for frontend port
- Set `BACKEND_PORT_API` for backend port
- Example: `PORT=80 BACKEND_PORT_API=3000 ./start`

## Backend API

### Authentication Endpoints

**Sign Up**
```
POST /api/auth/signup
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword"
}

Response: 201
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Sign In**
```
POST /api/auth/signin
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}

Response: 200
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### Favorite Courses Endpoints

All endpoints require `Authorization: Bearer <token>` header.

**Get Favorites**
```
GET /api/favorites
Authorization: Bearer <token>

Response: 200
{
  "favorites": ["course1.json", "course2.json"]
}
```

**Add Favorite**
```
POST /api/favorites
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseFilename": "course-name.json"
}

Response: 201
{
  "success": true
}
```

**Remove Favorite**
```
DELETE /api/favorites
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseFilename": "course-name.json"
}

Response: 200
{
  "success": true
}
```

## Backend Development

### Directory Structure

```
backend/
├── src/
│   ├── controllers/    Route handlers
│   ├── services/       Business logic
│   ├── models/         Drizzle ORM schemas
│   ├── db/
│   │   └── migrations/ Auto-generated migrations
│   ├── middleware/     Express middleware
│   └── index.ts        Express app setup
├── drizzle.config.ts   Drizzle configuration
├── package.json
├── tsconfig.json
└── .env                Environment variables (local)
```

### Useful Commands

```bash
cd backend

# Development server with hot reload
npm run dev

# Generate migrations (after changing models)
npm run db:generate

# Run migrations
npm run db:push

# View database in studio
npm run db:studio

# Build for production
npm run build

# Start production build
npm start
```

### Database

- **Type**: SQLite
- **ORM**: Drizzle
- **Location**: `backend/algolounge.db` (local)
- **Migrations**: `backend/src/db/migrations/`

#### Database Schema

**users** table
- `id` (integer, primary key)
- `username` (text, unique)
- `email` (text, unique)
- `passwordHash` (text)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**favorite_courses** table
- `id` (integer, primary key)
- `userId` (integer, foreign key)
- `courseFilename` (text)
- `createdAt` (timestamp)

### Authentication

- **Method**: JWT (JSON Web Tokens)
- **Expiration**: 30 days
- **Secret**: Configured in `.env` (JWT_SECRET)

## Frontend Development

The frontend is a standard Angular 19.2 application.

### Build Output

- **Development**: Served by Angular dev server on port 4200
- **Production**: Built to `backend/public/` directory
- Express serves the built Angular app in production

### Useful Commands

```bash
cd frontend

# Development server
npm start
# or
ng serve

# Build for production
ng build

# Run tests
ng test

# Sync question/course indices
npm run sync-index
```

## Project Features

### Authentication
- User registration with username, email, and password
- JWT-based authentication with 30-day tokens
- Password hashing with bcrypt

### Favorite Courses
- Fetch user's favorite courses
- Add/remove courses from favorites
- Synced with backend (not just local storage)
- Optional local storage fallback

### Multi-Language Support
- Python, JavaScript, TypeScript, Java
- Maintained from existing setup

## Deployment Notes

### Environment Variables

Create a `.env` file in the `backend/` directory:

```
PORT=3000
DATABASE_URL=./algolounge.db
JWT_SECRET=your-production-secret-key
```

For production, ensure:
- `JWT_SECRET` is a strong, unique key
- `DATABASE_URL` points to a production database (can still be SQLite)
- Set appropriate `PORT` values

### Building for Production

```bash
# From root directory
cd frontend
npm run build

# Navigate to backend and start
cd ../backend
npm run build
npm start
```

Or use the `./start` script with environment variables:

```bash
PORT=80 BACKEND_PORT_API=3000 ./start
```

## Troubleshooting

### Port Already in Use

If port 3000 or 4200 is already in use:

1. **Find the process**: `lsof -i :3000` (or 4200)
2. **Kill it**: `kill -9 <PID>`
3. Or change ports in `.env` files or environment variables

### Database Issues

If you encounter database corruption or issues:

```bash
cd backend
rm -f *.db *.db-shm *.db-wal
npm run db:push
```

### Dependency Issues

Clear and reinstall dependencies:

```bash
./setup
```

## Next Steps

1. Create Angular services for API integration (AuthService, FavoriteCoursesService)
2. Build signup/login UI components
3. Update courses page to integrate with favorites backend
4. Add error handling and loading states
5. Set up production deployment pipeline

