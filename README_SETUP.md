# AlgoLounge Full-Stack Setup Guide

AlgoLounge is now a full-stack application with a separate frontend and backend.

## Project Structure

```
algolounge.com/
├── frontend/          # Angular 19.2 application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Express.js + SQLite API
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── config/
│   └── package.json
└── README_SETUP.md    # This file
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run database migrations
npm run migrate

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:3000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start the Angular development server
npm start
```

The frontend will run on `http://localhost:4200`

## What's New

### Backend Features

1. **User Authentication**
   - Register new accounts
   - Login with JWT tokens
   - Secure password hashing with bcrypt

2. **Progress Tracking**
   - Track completed questions per user
   - Sync completion status across devices
   - Fallback to local storage when not authenticated

3. **RESTful API**
   - Authentication endpoints (`/api/auth/*`)
   - Question completion endpoints (`/api/questions/*`)
   - Proper error handling and validation

### Frontend Updates

1. **Authentication UI**
   - Login page at `/login`
   - Register page at `/register`
   - Login/Register buttons in global header
   - User menu with logout functionality

2. **Backend Integration**
   - `AuthService` for user authentication
   - `QuestionCompletionService` for syncing progress
   - Automatic fallback to local storage

3. **Seamless Experience**
   - Users can still use the app without logging in
   - Question completions sync when logged in
   - Completions stored in local storage as backup

## Development Workflow

### Running Both Services

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Making Changes

**Backend Changes:**
- Edit files in `backend/`
- Server auto-reloads with nodemon

**Frontend Changes:**
- Edit files in `frontend/src/`
- Angular dev server auto-reloads

### Database Changes

To modify the database schema:

```bash
cd backend
npm run migrate:make migration_name
# Edit the new migration file in backend/migrations/
npm run migrate
```

## Environment Variables

### Backend (.env)

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

**Important**: Change `JWT_SECRET` before deploying to production!

## API Documentation

See `backend/README.md` for detailed API documentation including:
- All available endpoints
- Request/response formats
- Authentication requirements
- Database schema

## Common Issues

### Backend won't start
- Check if port 3000 is already in use
- Ensure database migrations have been run
- Verify `.env` file exists in backend directory

### Frontend can't connect to backend
- Ensure backend is running on port 3000
- Check CORS configuration in `backend/server.js`
- Verify API URLs in frontend services (should be `http://localhost:3000`)

### Database errors
- Run migrations: `cd backend && npm run migrate`
- Check if `backend/config/database.sqlite` exists
- Try rolling back and re-running: `npm run migrate:rollback && npm run migrate`

## Deployment

### Backend Deployment

1. Set production environment variables
2. Change `JWT_SECRET` to a strong random string
3. Consider using PostgreSQL instead of SQLite for production
4. Deploy to services like Heroku, Railway, or DigitalOcean

### Frontend Deployment

1. Build the Angular app: `cd frontend && ng build`
2. Deploy `frontend/dist/alglounge` to static hosting (Vercel, Netlify, etc.)
3. Update API URLs to point to production backend

## Architecture Overview

```
┌─────────────────┐          ┌─────────────────┐
│  Angular SPA    │          │  Express.js     │
│  (Frontend)     │◄────────►│  (Backend)      │
│                 │   HTTP   │                 │
│  Port 4200      │          │  Port 3000      │
└─────────────────┘          └────────┬────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │   SQLite     │
                              │   Database   │
                              └──────────────┘
```

### Data Flow

1. **User Registers/Logs In**
   - Frontend sends credentials to `/api/auth/login` or `/api/auth/register`
   - Backend validates, hashes password (register), generates JWT token
   - Frontend stores token in localStorage
   - Token included in subsequent requests via Authorization header

2. **Question Completion**
   - User completes a question in frontend
   - Frontend calls `/api/questions/complete` with JWT token
   - Backend stores completion in database
   - Also stored in localStorage (`AL_completedQuestions`) as cache

3. **Checking Completion Status**
   - When loading a question, frontend checks cache first
   - If not in cache, calls `/api/questions/completed/:id`
   - Backend returns completion status
   - Result cached in localStorage

## Testing

### Backend Testing

```bash
cd backend
# Add test command to package.json and write tests
npm test
```

### Frontend Testing

```bash
cd frontend
ng test
```

## Contributing

1. Create a new branch for your feature
2. Make changes in appropriate directory (frontend/ or backend/)
3. Test thoroughly
4. Submit pull request

## License

MIT

## Support

For issues or questions:
- Check existing issues on GitHub
- Create a new issue with detailed description
- Include relevant logs and error messages
