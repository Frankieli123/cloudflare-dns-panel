import { Router } from 'express';
import { AuthService } from '../services/auth';
import { successResponse, errorResponse } from '../utils/response';
import { authenticateToken } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimit';
import { AuthRequest } from '../types';

const router = Router();

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, cfApiToken, cfAccountId } = req.body;

    if (!username || !password || !cfApiToken) {
      return errorResponse(res, '缺少必需参数', 400);
    }

    const user = await AuthService.register({
      username,
      email,
      password,
      cfApiToken,
      cfAccountId,
    });

    return successResponse(res, { user }, '注册成功', 201);
  } catch (error: any) {
    return errorResponse(res, error.message, 400);
  }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(res, '缺少用户名或密码', 400);
    }

    const result = await AuthService.login({ username, password });

    return successResponse(res, result, '登录成功');
  } catch (error: any) {
    return errorResponse(res, error.message, 401);
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await AuthService.getUserById(req.user!.id);
    return successResponse(res, { user }, '获取用户信息成功');
  } catch (error: any) {
    return errorResponse(res, error.message, 400);
  }
});

/**
 * PUT /api/auth/password
 * 修改密码
 */
router.put('/password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return errorResponse(res, '缺少必需参数', 400);
    }

    await AuthService.updatePassword(req.user!.id, oldPassword, newPassword);

    return successResponse(res, null, '密码修改成功');
  } catch (error: any) {
    return errorResponse(res, error.message, 400);
  }
});

/**
 * PUT /api/auth/cf-token
 * 更新 Cloudflare API Token
 */
router.put('/cf-token', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { cfApiToken } = req.body;

    if (!cfApiToken) {
      return errorResponse(res, '缺少 API Token', 400);
    }

    await AuthService.updateCfToken(req.user!.id, cfApiToken);

    return successResponse(res, null, 'API Token 更新成功');
  } catch (error: any) {
    return errorResponse(res, error.message, 400);
  }
});

export default router;
