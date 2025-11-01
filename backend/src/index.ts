import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleSignUp, handleSignIn } from './controllers/authController';
import {
  handleGetFavorites,
  handleAddFavorite,
  handleRemoveFavorite,
} from './controllers/favoriteCoursesController';
import { authMiddleware } from './middleware/auth';
import { initializeDb } from './db/index';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(express.json());

// API Routes
app.post('/api/auth/signup', handleSignUp);
app.post('/api/auth/signin', handleSignIn);

// Protected routes
app.get('/api/favorites', authMiddleware, handleGetFavorites);
app.post('/api/favorites', authMiddleware, handleAddFavorite);
app.delete('/api/favorites', authMiddleware, handleRemoveFavorite);

// Serve static files (built Angular app)
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;

// Initialize database and start server
initializeDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
