import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { supabase } from '../../config/supabase.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { HttpError } from '../../middleware/error-handler.js';
import type { AuthUser, AuthTokens, AuthResponse } from './auth.schemas.js';

const JWT_SECRET = env.JWT_SECRET || 'development-secret-key';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

class AuthService {
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      // Check admin users table first
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .single();

      if (!adminError && adminUser) {
        const isValidPassword = await bcrypt.compare(password, adminUser.password);
        if (!isValidPassword) {
          throw new HttpError(401, 'Invalid credentials');
        }

        const user: AuthUser = {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          role: 'admin',
          profile: {
            firstName: adminUser.name?.split(' ')[0],
            lastName: adminUser.name?.split(' ').slice(1).join(' '),
          },
        };

        const tokens = this.generateTokens(user);
        logger.info({ userId: user.id, username: user.username }, 'Admin login successful');
        return { user, tokens };
      }

      // Check faculty table
      const { data: facultyUser, error: facultyError } = await supabase
        .from('faculty')
        .select('id, faculty_code, first_name, last_name, email, password, department')
        .eq('faculty_code', username)
        .eq('status', 'active')
        .single();

      if (!facultyError && facultyUser) {
        const isValidPassword = await bcrypt.compare(password, facultyUser.password);
        if (!isValidPassword) {
          throw new HttpError(401, 'Invalid credentials');
        }

        const user: AuthUser = {
          id: facultyUser.id,
          username: facultyUser.faculty_code,
          email: facultyUser.email,
          role: 'faculty',
          profile: {
            firstName: facultyUser.first_name,
            lastName: facultyUser.last_name,
            departmentId: facultyUser.department,
          },
        };

        const tokens = this.generateTokens(user);
        logger.info({ userId: user.id, username: user.username }, 'Faculty login successful');
        return { user, tokens };
      }

      // Check students table
      const { data: studentUser, error: studentError } = await supabase
        .from('students')
        .select('id, register_number, first_name, last_name, email, password, class_id')
        .eq('register_number', username)
        .eq('status', 'active')
        .single();

      if (!studentError && studentUser) {
        const isValidPassword = await bcrypt.compare(password, studentUser.password);
        if (!isValidPassword) {
          throw new HttpError(401, 'Invalid credentials');
        }

        const user: AuthUser = {
          id: studentUser.id,
          username: studentUser.register_number,
          email: studentUser.email,
          role: 'student',
          profile: {
            firstName: studentUser.first_name,
            lastName: studentUser.last_name,
          },
        };

        const tokens = this.generateTokens(user);
        logger.info({ userId: user.id, username: user.username }, 'Student login successful');
        return { user, tokens };
      }

      throw new HttpError(401, 'Invalid credentials');
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      logger.error({ error, username }, 'Login error');
      throw new HttpError(500, 'Login failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
      
      if (decoded.type !== 'refresh') {
        throw new HttpError(401, 'Invalid refresh token');
      }

      // Verify user still exists and is active
      const user = await this.getUserById(decoded.userId, decoded.role);
      if (!user) {
        throw new HttpError(401, 'User not found or inactive');
      }

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      logger.error({ error }, 'Refresh token error');
      throw new HttpError(401, 'Invalid refresh token');
    }
  }

  async changePassword(userId: number, role: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      let table: string;
      let idField: string;

      switch (role) {
        case 'admin':
          table = 'admin_users';
          idField = 'id';
          break;
        case 'faculty':
          table = 'faculty';
          idField = 'id';
          break;
        case 'student':
          table = 'students';
          idField = 'id';
          break;
        default:
          throw new HttpError(400, 'Invalid role');
      }

      const { data: user, error: fetchError } = await supabase
        .from(table)
        .select('password')
        .eq(idField, userId)
        .single();

      if (fetchError || !user) {
        throw new HttpError(404, 'User not found');
      }

      const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidCurrentPassword) {
        throw new HttpError(400, 'Current password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      const { error: updateError } = await supabase
        .from(table)
        .update({ password: hashedNewPassword })
        .eq(idField, userId);

      if (updateError) {
        throw new HttpError(500, 'Failed to update password');
      }

      logger.info({ userId, role }, 'Password changed successfully');
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      logger.error({ error, userId, role }, 'Change password error');
      throw new HttpError(500, 'Failed to change password');
    }
  }

  private generateTokens(user: AuthUser): AuthTokens {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        type: 'refresh',
      },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  private async getUserById(userId: number, role: string): Promise<AuthUser | null> {
    try {
      switch (role) {
        case 'admin': {
          const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('id', userId)
            .single();

          if (error || !data) return null;

          return {
            id: data.id,
            username: data.username,
            email: data.email,
            role: 'admin',
            profile: {
              firstName: data.name?.split(' ')[0],
              lastName: data.name?.split(' ').slice(1).join(' '),
            },
          };
        }

        case 'faculty': {
          const { data, error } = await supabase
            .from('faculty')
            .select('id, faculty_code, first_name, last_name, email, department')
            .eq('id', userId)
            .eq('status', 'active')
            .single();

          if (error || !data) return null;

          return {
            id: data.id,
            username: data.faculty_code,
            email: data.email,
            role: 'faculty',
            profile: {
              firstName: data.first_name,
              lastName: data.last_name,
              departmentId: data.department,
            },
          };
        }

        case 'student': {
          const { data, error } = await supabase
            .from('students')
            .select('id, register_number, first_name, last_name, email, class_id')
            .eq('id', userId)
            .eq('status', 'active')
            .single();

          if (error || !data) return null;

          return {
            id: data.id,
            username: data.register_number,
            email: data.email,
            role: 'student',
            profile: {
              firstName: data.first_name,
              lastName: data.last_name,
            },
          };
        }

        default:
          return null;
      }
    } catch (error) {
      logger.error({ error, userId, role }, 'Get user by ID error');
      return null;
    }
  }
}

export const authService = new AuthService();