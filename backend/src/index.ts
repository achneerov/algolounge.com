import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleSignUp, handleSignIn } from './controllers/authController';
import {
  handleGetFavorites,
  handleAddFavorite,
  handleRemoveFavorite,
} from './controllers/favoriteCoursesController';
import { authMiddleware } from './middleware/auth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Determine CORS origin based on environment
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigin = isProduction
  ? process.env.CORS_ORIGIN || ['localhost', 'yourdomain.com']
  : 'http://localhost:4200';

// Middleware
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
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
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
