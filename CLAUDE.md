# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AlgoLounge is a full-stack interactive coding practice platform. It provides hands-on programming challenges and structured courses for developers to practice algorithmic thinking and problem-solving skills. The platform supports multiple programming languages (Python, JavaScript, TypeScript, Java) with in-browser code execution.

**Architecture**: Monorepo with separate frontend (Angular 19.2) and backend (Express.js + SQLite)

## Project Structure

```
algolounge.com/
├── frontend/              # Angular 19.2 SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/           # Route components (home, questions, courses, auth)
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── services/        # Business logic services
│   │   │   ├── interceptors/    # HTTP interceptors (auth)
│   │   │   └── workers/         # Web workers
│   │   ├── environments/        # Environment configs (dev/prod)
│   │   └── styles/              # Global SCSS styles
│   ├── public/                  # Static assets (questions, courses JSON)
│   ├── package.json
│   └── angular.json
│
├── backend/               # Express.js REST API
│   ├── src/
│   │   ├── index.ts             # Express server entry point
│   │   ├── db/
│   │   │   ├── index.ts         # Drizzle ORM setup
│   │   │   ├── models/          # Database schemas (users, completions, favorites)
│   │   │   └── migrations/      # Drizzle migration files
│   │   ├── routes/              # API routes (auth, favorites, completions)
│   │   ├── services/            # Business logic (auth service)
│   │   └── middleware/          # Express middleware (auth)
│   ├── database.db              # SQLite database file
│   ├── drizzle.config.ts        # Drizzle ORM configuration
│   ├── .env.local               # Environment variables
│   └── package.json
│
├── setup                  # Initial project setup script
├── start                  # Development startup script (runs both servers)
└── deploy                 # Production deployment script
```

## Quick Start

### First-Time Setup
```bash
./setup    # Installs dependencies, creates database, generates env files
```

### Development
```bash
./start    # Starts both backend (port 3000) and frontend (port 4200)
```
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api

### Production Deployment
```bash
./deploy   # Builds, migrates, and deploys to production
```

## Development Commands

### Root Level
- `./setup` - First-time setup (installs deps, creates DB, generates env files)
- `./start` - Starts both backend and frontend in development mode
- `./deploy` - Production deployment (build, migrate, restart services)

### Frontend (`/frontend`)
```bash
npm start              # Angular dev server on :4200
npm run build          # Production build
npm run watch          # Watch mode build
npm test               # Run unit tests with Karma
npm run sync-index     # Sync questions/courses index files
```

### Backend (`/backend`)
```bash
npm run dev            # Development server with auto-reload (tsx watch)
npm run build          # Build TypeScript to JavaScript
npm run db:generate    # Generate Drizzle migrations from schema changes
npm run db:migrate     # Run pending database migrations
```

## Tech Stack

### Frontend
- **Framework**: Angular 19.2 (standalone components)
- **UI Library**: PrimeNG 19.1.3 (Aura theme)
- **Code Editor**: CodeMirror 6 (Python, JavaScript, Java syntax)
- **HTTP Client**: Angular HttpClient with RxJS 7.8
- **Animations**: Canvas Confetti 1.9.3
- **Code Execution**:
  - Python: Pyodide (browser-based Python runtime)
  - JavaScript/TypeScript: Function constructor with safe execution
  - Java: CheerpJ (browser-based JVM with ECJ compiler)

### Backend
- **Runtime**: Node.js with TypeScript 5.9.3
- **Framework**: Express.js 5.1.0
- **Database**: SQLite (better-sqlite3 9.6.0)
- **ORM**: Drizzle ORM 0.44.7
- **Authentication**:
  - JWT (jsonwebtoken 9.0.2)
  - Password hashing (bcryptjs 3.0.2)
- **CORS**: cors 2.8.5
- **Environment**: dotenv 17.2.3
- **Dev Runtime**: tsx 4.20.6 (TypeScript execution)

## Database Schema

**Database**: SQLite (`backend/database.db`)
**ORM**: Drizzle ORM
**Migrations**: `backend/src/db/migrations/`

### Tables

#### `users`
User account information
```typescript
{
  id: integer (primary key)
  username: text (unique, not null)
  email: text (unique, not null)
  password_hash: text (not null)
  created_at: integer (timestamp)
  updated_at: integer (timestamp)
}
```

#### `question_completions`
Tracks completed questions per user
```typescript
{
  id: integer (primary key)
  user_id: integer (foreign key → users.id)
  question_filename: text (not null)
  completed_at: integer (timestamp)
}
```

#### `favorite_courses`
User's favorite courses
```typescript
{
  id: integer (primary key)
  user_id: integer (foreign key → users.id)
  course_filename: text (not null)
  created_at: integer (timestamp)
  // Unique constraint: (user_id, course_filename)
}
```

**Model Files**: `backend/src/db/models/users.ts`, `question-completions.ts`, `favorite-courses.ts`

## API Endpoints

**Base URL (Development)**: `http://localhost:3000/api`
**Base URL (Production)**: `/api` (relative, same origin)

### Authentication (`/api/auth`)

#### `POST /api/auth/signup`
Register a new user
```json
// Request
{
  "username": "string",
  "email": "string",
  "password": "string"
}

// Response
{
  "user": {
    "id": 1,
    "username": "string",
    "email": "string"
  },
  "token": "jwt_token_string"
}
```

#### `POST /api/auth/signin`
Login existing user (supports email or username)
```json
// Request
{
  "login": "email_or_username",
  "password": "string"
}

// Response
{
  "user": {
    "id": 1,
    "username": "string",
    "email": "string"
  },
  "token": "jwt_token_string"
}
```

### Question Completions (`/api/question-completions`, requires auth)

#### `GET /api/question-completions`
Get authenticated user's completed questions
```json
// Response
[
  {
    "id": 1,
    "user_id": 1,
    "question_filename": "two-sum.json",
    "completed_at": 1234567890
  }
]
```

#### `POST /api/question-completions`
Mark a question as completed
```json
// Request
{
  "questionFilename": "two-sum.json"
}

// Response
{
  "id": 1,
  "user_id": 1,
  "question_filename": "two-sum.json",
  "completed_at": 1234567890
}
```

### Favorites (`/api/favorites`, requires auth)

#### `GET /api/favorites`
Get authenticated user's favorite courses
```json
// Response
[
  {
    "id": 1,
    "user_id": 1,
    "course_filename": "neetcode-150.json",
    "created_at": 1234567890
  }
]
```

#### `POST /api/favorites`
Add a course to favorites
```json
// Request
{
  "courseFilename": "neetcode-150.json"
}

// Response
{
  "id": 1,
  "user_id": 1,
  "course_filename": "neetcode-150.json",
  "created_at": 1234567890
}
```

#### `DELETE /api/favorites`
Remove a course from favorites
```json
// Request
{
  "courseFilename": "neetcode-150.json"
}

// Response: 204 No Content
```

### Health Check

#### `GET /api/health`
Check server status
```json
// Response
{
  "status": "ok"
}
```

## Authentication Flow

### Backend (`backend/src/services/auth.ts`)
1. **Registration**: Hash password with bcryptjs (10 salt rounds), save user, generate JWT
2. **Login**: Verify password, generate JWT (30-day expiry)
3. **JWT Secret**: Configured in `backend/.env.local` (`JWT_SECRET`)

### Frontend (`frontend/src/app/services/auth.service.ts`)
1. **AuthService**: Manages authentication state with RxJS observables
2. **Storage**: Stores JWT token and user data in localStorage
3. **Interceptor** (`frontend/src/app/interceptors/auth.interceptor.ts`): Automatically adds `Authorization: Bearer <token>` header to API requests

### Protected Routes
Backend middleware (`backend/src/middleware/auth.ts`) verifies JWT for protected endpoints:
- `/api/question-completions/*`
- `/api/favorites/*`

## Frontend Architecture

### Routing
- `/` - Home page
- `/questions/:name` - Question detail page with IDE
- `/courses` - Course listing page
- `/courses/:filename` - Course detail page
- `/auth/sign-in` - Sign in page
- `/auth/sign-up` - Sign up page

### Key Services (`frontend/src/app/services/`)

#### **AuthService** (NEW)
Manages user authentication
- `register(username, email, password)` - Sign up
- `login(login, password)` - Sign in
- `logout()` - Clear auth state
- `currentUser$` - Observable of current user
- `isAuthenticated$` - Observable of auth status

#### **CompletionService** (NEW)
Manages question completion tracking
- `syncWithBackend()` - Sync local progress to server
- `loadCompletedQuestions()` - Load from backend
- `markCompleted(questionFilename)` - Mark question complete
- `completedQuestions$` - Observable of completed questions

#### **FavoritesService** (NEW)
Manages course favorites
- `loadFavorites()` - Load from backend
- `addFavorite(courseFilename)` - Add favorite
- `removeFavorite(courseFilename)` - Remove favorite
- `favorites$` - Observable of favorite courses

#### **CodeExecutionService** (existing)
Handles multi-language code execution
- **Python**: Pyodide (browser-based Python runtime)
- **JavaScript/TypeScript**: Function constructor with safe execution
- **Java**: CheerpJ (browser-based JVM with ECJ compiler)

#### **ThemeService** (existing)
Manages dark/light mode theming

#### **LocalStorageService** (existing)
Manages local storage operations

#### **CourseSearchService** / **QuestionSearchService** (existing)
Handle search functionality for courses and questions

### Pages (`frontend/src/app/pages/`)
- `home/` - Landing page
- `questions/` - Question detail page with IDE, console, content tabs
- `courses/` - Course listing page
- `course-detail/` - Individual course page
- `auth/sign-in/` - Sign in page
- `auth/sign-up/` - Sign up page
- `not-found/` - 404 page

### Questions Page Components
- **IdeComponent**: CodeMirror-based code editor with syntax highlighting
- **ConsoleComponent**: Test results and execution output display
- **ContentTabsComponent**: Description, solution tabs with completion tracking

## Content Structure

### Questions (`frontend/public/questions/`)
JSON files with multi-language support
```json
{
  "name": "Two Sum",
  "difficulty": "Easy",
  "description": "...",
  "languages": {
    "python": {
      "template": "...",
      "solution": "...",
      "testCases": [...]
    },
    "javascript": {...},
    "typescript": {...},
    "java": {...}
  }
}
```

### Courses (`frontend/public/courses/`)
JSON files with structured learning paths
```json
{
  "name": "NeetCode 150",
  "description": "...",
  "units": [
    {
      "name": "Arrays & Hashing",
      "questions": ["two-sum.json", "valid-anagram.json"]
    }
  ]
}
```

### Index Files
Auto-generated by `npm run sync-index` script for search functionality

## Environment Configuration

### Backend (`backend/.env.local`)
```bash
NODE_ENV=development|production
JWT_SECRET=<random-32-byte-base64-string>
PORT=3000
CORS_ORIGIN=http://localhost:4200  # dev: :4200, prod: domain
```

### Frontend Development (`frontend/src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

### Frontend Production (`frontend/src/environments/environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: ''  // Empty string - uses relative /api path
};
```

## Deployment

### Production Architecture
1. Backend serves static Angular build from `backend/public/`
2. Frontend makes API calls to relative `/api` path
3. Both run on same origin/port (3000) in production
4. Backend handles all requests: serves SPA + API routes

### Deployment Process (`./deploy` script)
1. Pull latest code from git
2. Install dependencies (frontend + backend)
3. Run database migrations
4. Set up production environment files
5. Build Angular app (production mode)
6. Copy built files to `backend/public/`
7. Kill existing backend processes
8. Start backend server

## Development Guidelines

### Adding New Questions
1. Create JSON file in `frontend/public/questions/` following multi-language format
2. Include all supported languages (python, javascript, typescript, java)
3. Add templates, solutions, and comprehensive test cases
4. Run `npm run sync-index` from frontend directory to update indices

### Adding New Courses
1. Create JSON file in `frontend/public/courses/` with course structure
2. Organize content in units with question filename references
3. Run `npm run sync-index` from frontend directory

### Database Migrations
1. Edit schema files in `backend/src/db/models/`
2. Run `npm run db:generate` to create migration file
3. Run `npm run db:migrate` to apply migrations
4. Commit migration files to version control

### Working with Authentication
- Backend routes requiring auth use `authMiddleware` from `backend/src/middleware/auth.ts`
- Frontend automatically adds JWT token via `AuthInterceptor`
- Token stored in localStorage, cleared on logout
- JWT expires after 30 days

### Component Development
- Use Angular standalone component architecture
- Follow dependency injection patterns
- Implement proper lifecycle management for resource cleanup
- Use PrimeNG components for consistent UI
- Follow 8pt grid spacing system (see Design System below)
- Test all interactive states: hover, active, focus, disabled

## Design System

### 8pt Grid Spacing System
ALL spacing must use multiples of 8 to maintain consistency:
- **Spacing Scale**: 8px, 16px, 24px, 32px, 40px, 48px, 64px, 96px
- **Core Rule**: Internal spacing ≤ External spacing
- **Section Padding**: 96px vertical, 64px horizontal (desktop), 64px/24px (mobile)
- **Card Padding**: 40px internal
- **Element Gaps**: 32px (large), 24px (medium), 16px (small), 8px (tight)

### Typography Scale
- **Headlines**: 64px (hero), 48px (sections), 24px (subsections)
- **Body Text**: 18px (large/intro), 16px (normal)
- **Line Heights**: 1.1 (large headlines), 1.2-1.3 (titles), 1.6 (body text)
- **Font Weights**: 400 (regular), 600 (semibold), 700 (bold) - ONLY use these 3
- **Max Line Length**: 70-80 characters (~480px at 16px)

### Theme & Styling
- **Colors**: Use theme variables exclusively
  - Primary: `var(--color-primary)` (#3B82F6 blue)
  - Accent: `var(--color-accent)` (#F59E0B gold)
  - Text: `var(--color-text-primary)`, `var(--color-text-secondary)`
- **Border Radius**: `$radius-lg` (0.75rem), `$radius-xl` (1rem)
- **Shadows**: `$shadow-sm`, `$shadow-md`, `$shadow-lg`
- **Borders**: `1px solid var(--color-border)`

### UI Component Standards
- **Icons**: NO emojis - use minimal SVG icons only (32px standard)
- **Cards**:
  - Max 3 feature cards per section
  - Hover: `transform: translateY(-4px)` + enhanced shadow
- **Buttons**:
  - Primary: filled background
  - Secondary: outlined
  - Padding: 16px vertical, 32px horizontal
- **Layout**: F-pattern (left-aligned) except final CTAs (centered)

## Testing

### Frontend Tests
```bash
cd frontend
npm test           # Run unit tests with Karma + Jasmine
```
- Test files: `*.spec.ts` located alongside components/services

### Backend Tests
Currently no automated backend tests configured

### Question Validation
- Ensure all question solutions work across all supported languages
- Verify test cases produce expected outputs
- Test code execution for edge cases

## Key Features

1. **User Accounts** - Sign up/sign in with email and password
2. **Progress Persistence** - Question completions synced to backend database
3. **Course Favorites** - Users can favorite courses
4. **Multi-language Support** - Python, JavaScript, TypeScript, Java
5. **In-browser Code Execution** - No server-side code execution needed
6. **JWT Authentication** - Secure token-based auth
7. **Dark Mode** - Full theme support throughout application
8. **Responsive Design** - Mobile and desktop optimized

## Critical File Paths

### Backend
- Entry point: `backend/src/index.ts`
- Database setup: `backend/src/db/index.ts`
- Models: `backend/src/db/models/*.ts`
- Auth service: `backend/src/services/auth.ts`
- Auth routes: `backend/src/routes/auth.ts`
- Auth middleware: `backend/src/middleware/auth.ts`

### Frontend
- Auth service: `frontend/src/app/services/auth.service.ts`
- Completion service: `frontend/src/app/services/completion.service.ts`
- Favorites service: `frontend/src/app/services/favorites.service.ts`
- Auth interceptor: `frontend/src/app/interceptors/auth.interceptor.ts`
- Auth pages: `frontend/src/app/pages/auth/sign-in/`, `sign-up/`
- Environment configs: `frontend/src/environments/*.ts`

### Scripts
- Setup: `./setup`
- Start dev: `./start`
- Deploy: `./deploy`
