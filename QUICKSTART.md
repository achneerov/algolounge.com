# QuickStart Guide

Get AlgoLounge running in 2 commands.

## 1. Initial Setup (One-time)

```bash
./setup
```

This installs all dependencies and sets up the database.

## 2. Start Development

```bash
./start
```

That's it! You now have:
- **Frontend**: http://localhost:4200 (Angular)
- **Backend**: http://localhost:3000 (Express API)

Both have hot reload enabled. Press `Ctrl+C` to stop both gracefully.

## What Each Script Does

### `./setup`
- `git pull` - Updates code
- Installs npm dependencies for frontend and backend
- Sets up SQLite database
- Runs migrations

Run this whenever you pull new code or add new dependencies.

### `./start`
- Starts Express backend on port 3000
- Starts Angular frontend on port 4200
- Both watch for file changes (hot reload)
- Ctrl+C stops both

## Testing the API

Once servers are running:

```bash
# Create an account
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Get the token from response, then test protected endpoint
# Replace YOUR_TOKEN with the token from signup
curl -X GET http://localhost:3000/api/favorites \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Next Steps

1. Read `README_SETUP.md` for detailed setup info
2. Read `RESTRUCTURE_SUMMARY.md` to understand what changed
3. Start building frontend integrations (see README_SETUP.md next steps)

## Need Help?

- Check `README_SETUP.md` for troubleshooting
- Check `backend/README.md` for API development
- Check `frontend/README.md` for Angular development (existing)

