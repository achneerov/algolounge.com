# CLAUDE.md

## Overview
AlgoLounge is a full-stack coding practice platform with real-time multiplayer quizzes. Built with Angular 19.2 (frontend) and Express.js + SQLite (backend).

## Quick Commands
```bash
./setup    # First-time setup (deps, DB, env files)
./start    # Dev servers: frontend :4200, backend :3000
./deploy   # Production build and deploy
```

### Frontend (`/frontend`)
- `npm start` - Dev server
- `npm run build` - Production build
- `npm run sync-index` - Sync questions/courses indices

### Backend (`/backend`)
- `npm run dev` - Dev server with watch
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database

## Project Structure
```
frontend/src/app/
├── pages/           # Route components
│   ├── home, questions, courses, course-detail, unit-detail
│   ├── quiz/ (quiz-home, quiz-lobby, quiz-play)
│   ├── admin, auth/sign-in, auth/sign-up, not-found
├── components/      # Reusable UI
├── services/        # Business logic (auth, quiz, completion, favorites, sse, admin)
└── interceptors/    # HTTP interceptors

backend/src/
├── routes/          # API routes (auth, favorites, question-completions, quiz-templates, quiz-events, admin)
├── services/        # Business logic (auth, quiz, scoring, sse)
├── middleware/      # Auth middleware
└── db/models/       # Drizzle schemas
```

## Routes
| Path | Component |
|------|-----------|
| `/home` | Home |
| `/questions/:name` | Question IDE |
| `/courses` | Course list |
| `/courses/:filename` | Course detail |
| `/courses/:courseName/:unitKey` | Unit detail |
| `/quiz` | Quiz home |
| `/quiz/:roomCode/lobby` | Quiz lobby |
| `/quiz/:roomCode/play` | Quiz play |
| `/admin` | Admin panel |
| `/auth/sign-in`, `/auth/sign-up` | Authentication |

## API Endpoints
**Base**: `http://localhost:3000/api` (dev) | `/api` (prod)

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/signup` | Register user |
| `POST /api/auth/signin` | Login (email or username) |
| `GET/POST /api/question-completions` | Track completed questions (auth required) |
| `GET/POST/DELETE /api/favorites` | Manage favorite courses (auth required) |
| `/api/quiz-templates/*` | Quiz template CRUD |
| `/api/quiz-events/*` | Live quiz sessions |
| `/api/admin/*` | Admin operations |
| `GET /api/health` | Health check |

## Database Schema (SQLite + Drizzle ORM)

### Core Tables
- **users**: id, username, email, password_hash, role_id, created_at, updated_at
- **user_roles**: id, role_name
- **question_completions**: id, user_id, question_filename, completed_at
- **favorite_courses**: id, user_id, course_filename, created_at

### Quiz System
- **question_types**: id, type_name
- **questions**: id, question_type_id, question_text, image_filename, timing configs
- **questions_multiple_choice_2/3/4**: question_id, options, correct_option_index
- **questions_true_false**: question_id, correct_answer
- **questions_typed**: question_id, correct_answer, case_sensitive
- **quiz_templates**: id, name, transition_seconds, status_id, music_filename
- **quiz_template_rounds**: id, quiz_template_id, question_id, round_order
- **quiz_events**: id, quiz_template_id, room_code, created_by_user_id, status
- **quiz_event_participants**: id, quiz_event_id, user_id
- **quiz_event_rounds**: id, quiz_event_id, quiz_template_round_id, round_number, status
- **quiz_round_performances**: id, quiz_event_round_id, user_id, user_answer, answered_correctly, points_earned

## Tech Stack
**Frontend**: Angular 19.2, PrimeNG 19.1.3, CodeMirror 6, RxJS 7.8, TypeScript 5.7
**Backend**: Express 5.1, Drizzle ORM 0.44.7, better-sqlite3, JWT, bcryptjs, busboy
**Code Execution**: Pyodide v0.28.0 (Python only, runs in Web Worker)

## Code Execution & Judging System

Code runs client-side via Pyodide in a Web Worker with 5-second timeout.

### Judging Flow
1. User's code is executed to define their function
2. `prepare(test_case_input)` extracts args from test input JSON
3. User's function is called: `result = entry_function(*prepared_args)`
4. `verify(actual_output, expected_output, [input])` checks correctness
5. Returns `[passed: bool, output_string: str]`

### Question JSON Format (`frontend/public/questions/*.json`)
```json
{
  "filename": "two-sum",
  "title": "Two Sum",
  "difficulty": "Easy",
  "tags": ["Arrays and Hashing"],
  "keywords": ["array", "hash", "map"],
  "description": "<h2>Title</h2><p>Problem description HTML...</p>",
  "entry_function": "twoSum",
  "template": "def twoSum(nums, target):\n  ",
  "solution_code": "def twoSum(nums, target):\n    seen = {}\n    ...",
  "solution_text": "<h3>Explanation HTML...</h3>",
  "prepare": "def prepare(test_case_input):\n    return (test_case_input['nums'], test_case_input['target'])",
  "verify": "def verify(actual_output, expected_output):\n    # Return [passed: bool, output_string: str]\n    return [actual_output == expected_output, str(actual_output)]",
  "test_cases": [
    {"id": 1, "input": {"nums": [2,7,11,15], "target": 9}, "output": [0,1]}
  ]
}
```

### Key Fields
| Field | Description |
|-------|-------------|
| `entry_function` | Function name user must implement |
| `template` | Starter code shown to user |
| `prepare` | Extracts function args from test input dict, returns tuple |
| `verify` | Validates result, returns `[passed, output_string]`. Can take optional 3rd param for input |
| `test_cases` | Array of `{id, input, output}` objects |

## Content Files
- Questions: `frontend/public/questions/*.json`
- Courses: `frontend/public/courses/*.json`
- Run `npm run sync-index` after adding content

## Adding Questions
1. Check https://github.com/doocs/leetcode/tree/main/solution for Python solutions
2. Create JSON in `frontend/public/questions/` following format above
3. Implement `prepare` to unpack test input into function args
4. Implement `verify` for custom validation (order-independent comparisons, etc.)
5. Run `npm run sync-index`

## Environment
**Backend** (`backend/.env.local`):
```bash
NODE_ENV=development|production
JWT_SECRET=<random-string>
PORT=3000
CORS_ORIGIN=http://localhost:4200
```

## Auth Flow
1. Backend: bcryptjs (10 rounds), JWT (30-day expiry)
2. Frontend: AuthInterceptor adds `Authorization: Bearer <token>`
3. Protected routes use `authMiddleware`

## Design Guidelines
- 8pt grid spacing (8, 16, 24, 32, 40, 48, 64, 96px)
- Theme vars: `--color-primary`, `--color-accent`, `--color-text-*`
- Font weights: 400, 600, 700 only
- No emojis - use SVG icons
- PrimeNG Aura theme
