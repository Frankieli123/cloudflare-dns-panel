import { Router } from 'express';
import { AuthService } from '../services/auth';
import { CloudflareService } from '../services/cloudflare';
import { successResponse, errorResponse } from '../utils/response';
import { authenticateToken } from '../middleware/auth';
import { generalLimiter } from '../middleware/rateLimit';
import { AuthRequest } from '../types';

const router = Router();

/**
 * GET /api/domains
 * 获取所有域名列表
 */
router.get('/', authenticateToken, generalLimiter, async (req: AuthRequest, res) => {
  try {
    const cfToken = await AuthService.getUserCfToken(req.user!.id);
    const cfService = new CloudflareService(cfToken);

    const domains = await cfService.getDomains();

    return successResponse(res, { domains }, '获取域名列表成功');
  } catch (error: any) {
    return errorResponse(res, error.message, 400);
  }
});

/**
 * GET /api/domains/:zoneId
 * 获取域名详情
 */
router.get('/:zoneId', authenticateToken, generalLimiter, async (req: AuthRequest, res) => {
  try {
    const { zoneId } = req.params;

    const cfToken = await AuthService.getUserCfToken(req.user!.id);
    const cfService = new CloudflareService(cfToken);

    const domain = await cfService.getDomainById(zoneId);

    return successResponse(res, { domain }, '获取域名详情成功');
  } catch (error: any) {
    return errorResponse(res, error.message, 400);
  }
});

/**
 * POST /api/domains/refresh
 * 刷新域名缓存
 */
router.post('/refresh', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const cfToken = await AuthService.getUserCfToken(req.user!.id);
    const cfService = new CloudflareService(cfToken);

    cfService.clearCache('domains');

    return successResponse(res, null, '缓存已刷新');
  } catch (error: any) {
    return errorResponse(res, error.message, 400);
  }
});

export default router;
