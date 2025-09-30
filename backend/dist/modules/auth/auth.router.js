import { Router } from 'express';
import cookieParser from 'cookie-parser';
import { login, logout, refreshToken, changePassword, getProfile } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.js';
export const authRouter = Router();
// Apply cookie parser to auth routes
authRouter.use(cookieParser());
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/refresh', refreshToken);
authRouter.post('/change-password', requireAuth, changePassword);
authRouter.get('/profile', requireAuth, getProfile);
