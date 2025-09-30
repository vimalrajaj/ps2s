import type { Request, Response } from 'express';

import { authService } from './auth.service.js';
import { HttpError } from '../../middleware/error-handler.js';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from './auth.schemas.js';
import { logger } from '../../utils/logger.js';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    
    const authResponse = await authService.login(username, password);
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', authResponse.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      data: {
        user: authResponse.user,
        accessToken: authResponse.tokens.accessToken,
        expiresIn: authResponse.tokens.expiresIn,
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        details: error.details,
      });
    }

    logger.error({ error }, 'Login controller error');
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshTokenFromCookie = req.cookies?.refreshToken;
    const refreshTokenFromBody = req.body?.refreshToken;
    
    const refreshToken = refreshTokenFromCookie || refreshTokenFromBody;
    
    if (!refreshToken) {
      throw new HttpError(401, 'Refresh token is required');
    }

    const tokens = await authService.refreshToken(refreshToken);

    // Update refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    logger.error({ error }, 'Refresh token controller error');
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const logout = async (_req: Request, res: Response) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');
  
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = (req as any).user; // Set by auth middleware

    if (!user) {
      throw new HttpError(401, 'Authentication required');
    }

    await authService.changePassword(user.userId, user.role, currentPassword, newPassword);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    logger.error({ error }, 'Change password controller error');
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // Set by auth middleware

    if (!user) {
      throw new HttpError(401, 'Authentication required');
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.userId,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Get profile controller error');
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};