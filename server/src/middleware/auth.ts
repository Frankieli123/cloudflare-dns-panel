import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { errorResponse } from '../utils/response';
import { AuthRequest } from '../types';

/**
 * JWT 验证中间件
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return errorResponse(res, '未提供认证令牌', 401);
    }

    jwt.verify(token, config.jwt.secret, (err, decoded: any) => {
      if (err) {
        return errorResponse(res, '无效或过期的令牌', 401);
      }

      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
      };

      next();
    });
  } catch (error) {
    return errorResponse(res, '认证失败', 401);
  }
}
