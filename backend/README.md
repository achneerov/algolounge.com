# AlgoLounge Backend

Express.js backend server with SQLite database for user authentication and progress tracking.

## Features

- **User Authentication**: JWT-based authentication with secure password hashing (bcrypt)
- **Question Completion Tracking**: Track which questions users have completed
- **RESTful API**: Clean API design following REST principles
- **Database Migrations**: Knex.js for database schema management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite with Knex.js
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: express-validator

## Project Structure

```
backend/
├── config/
│   ├── database.js         # Database connection setup
│   ├── knexfile.js         # Knex configuration
│   └── database.sqlite     # SQLite database file (created after migration)
├── controllers/
│   ├── authController.js        # Authentication logic (register, login)
│   └── questionController.js    # Question completion logic
├── routes/
│   ├── authRoutes.js       # Auth endpoints
│   └── questionRoutes.js   # Question completion endpoints
├── models/
│   ├── User.js             # User model
│   └── QuestionCompletion.js    # QuestionCompletion model
├── middleware/
│   └── auth.js             # JWT authentication middleware
├── migrations/
│   ├── 20250120000001_create_users_table.js
│   └── 20250120000002_create_question_completions_table.js
├── .env                    # Environment variables
├── server.js               # Express app entry point
└── package.json
```

## Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Update `.env` with your configuration:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

**IMPORTANT**: Change `JWT_SECRET` to a strong random string in production!

### 3. Run Database Migrations

```bash
npm run migrate
```

This will create the SQLite database and set up the tables.

### 4. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

The server will run on `http://localhost:3000` (or the PORT specified in .env).

## API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### Get Profile (Protected)
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Question Completions

#### Check if Question is Completed (Optional Auth)
```http
GET /api/questions/completed/:question_id
Authorization: Bearer <token>  (optional)
```

Response:
```json
{
  "completed": true
}
```

#### Mark Question as Complete (Protected)
```http
POST /api/questions/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "question_id": "two-sum"
}
```

#### Get User's Completions (Protected)
```http
GET /api/questions/completions
Authorization: Bearer <token>
```

#### Delete Completion (Protected)
```http
DELETE /api/questions/complete/:question_id
Authorization: Bearer <token>
```

## Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| username | STRING(50) | Unique username |
| email | STRING(100) | Unique email |
| password_hash | STRING(255) | Hashed password |
| created_at | TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | Last update time |

### question_completions
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| user_id | INTEGER | Foreign key to users.id |
| question_id | STRING(100) | Question identifier (from JSON) |
| completed_at | TIMESTAMP | Completion timestamp |

**Constraints:**
- Unique constraint on (user_id, question_id) - prevents duplicate completions
- Cascade delete on user_id - deletes completions when user is deleted

## Development Commands

```bash
# Start server with auto-reload
npm run dev

# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Create new migration
npm run migrate:make migration_name
```

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with salt rounds
2. **JWT Tokens**: Secure token-based authentication
3. **Input Validation**: Request validation using express-validator
4. **CORS**: Cross-origin resource sharing enabled for frontend integration
5. **Environment Variables**: Sensitive data stored in .env file

## CORS Configuration

The backend is configured to accept requests from the frontend running on `http://localhost:4200`. Update the CORS settings in `server.js` if your frontend runs on a different port or domain.

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `201`: Resource created
- `400`: Bad request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `404`: Not found
- `500`: Server error

## License

MIT
