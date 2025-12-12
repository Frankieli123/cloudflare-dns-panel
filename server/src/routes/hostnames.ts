import { Router } from 'express';
import { AuthService } from '../services/auth';
import { CloudflareService } from '../services/cloudflare';
import { LoggerService } from '../services/logger';
import { successResponse, errorResponse } from '../utils/response';
import { authenticateToken } from '../middleware/auth';
import { dnsLimiter, generalLimiter } from '../middleware/rateLimit';
import { getClientIp } from '../middleware/logger';
import { AuthRequest } from '../types';

const router = Router();

/**
 * GET /api/hostnames/:zoneId/fallback_origin
 * 获取回退源
 */
router.get('/:zoneId/fallback_origin', authenticateToken, generalLimiter, async (req: AuthRequest, res) => {
  try {
    const { zoneId } = req.params;
    const cfToken = await AuthService.getUserCfToken(req.user!.id);
    const cfService = new CloudflareService(cfToken);
    const origin = await cfService.getFallbackOrigin(zoneId);
    return successResponse(res, { origin }, '获取回退源成功');
  } catch (error: any) {
    return errorResponse(res, error.message, 400);
  }
});

/**
 * PUT /api/hostnames/:zoneId/fallback_origin
 * 更新回退源
 */
router.put('/:zoneId/fallback_origin', authenticateToken, dnsLimiter, async (req: AuthRequest, res) => {
  try {
    const { zoneId } = req.params;
    const { origin } = req.body;
    
    if (!origin) return errorResponse(res, '回退源地址不能为空', 400);

    const cfToken = await AuthService.getUserCfToken(req.user!.id);
    const cfService = new CloudflareService(cfToken);
    const result = await cfService.updateFallbackOrigin(zoneId, origin);

    await LoggerService.createLog({
      userId: req.user!.id,
      action: 'UPDATE',
      resourceType: 'FALLBACK_ORIGIN',
      newValue: origin,
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
    });

    return successResponse(res, { origin: result }, '更新回退源成功');
  } catch (error: any) {
    return errorResponse(res, error.message, 400);
  }
});

/**
 * GET /api/hostnames/:zoneId
 * 获取自定义主机名列表
 */
router.get('/:zoneId', authenticateToken, generalLimiter, async (req: AuthRequest, res) => {
  try {
    const { zoneId } = req.params;

    const cfToken = await AuthService.getUserCfToken(req.user!.id);
    const cfService = new CloudflareService(cfToken);

    const hostnames = await cfService.getCustomHostnames(zoneId);

    return successResponse(res, { hostnames }, '获取自定义主机名成功');
  } catch (error: any) {
    console.error('获取自定义主机名失败:', error);
    console.error('错误详情:', JSON.stringify(error, null, 2));
    return errorResponse(res, error.message, 400);
  }
});

/**
 * POST /api/hostnames/:zoneId
 * 创建自定义主机名
 */
router.post('/:zoneId', authenticateToken, dnsLimiter, async (req: AuthRequest, res) => {
  try {
    const { zoneId } = req.params;
    const { hostname } = req.body;

    if (!hostname) {
      return errorResponse(res, '缺少主机名参数', 400);
    }

    const cfToken = await AuthService.getUserCfToken(req.user!.id);
    const cfService = new CloudflareService(cfToken);

    const result = await cfService.createCustomHostname(zoneId, hostname);

    // 记录日志
    await LoggerService.createLog({
      userId: req.user!.id,
      action: 'CREATE',
      resourceType: 'HOSTNAME',
      recordName: hostname,
      newValue: JSON.stringify(result),
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
    });

    return successResponse(res, { hostname: result }, '自定义主机名创建成功', 201);
  } catch (error: any) {
    // 记录失败日志
    await LoggerService.createLog({
      userId: req.user!.id,
      action: 'CREATE',
      resourceType: 'HOSTNAME',
      recordName: req.body.hostname,
      status: 'FAILED',
      errorMessage: error.message,
      ipAddress: getClientIp(req),
    });

    return errorResponse(res, error.message, 400);
  }
});

/**
 * DELETE /api/hostnames/:zoneId/:hostnameId
 * 删除自定义主机名
 */
router.delete('/:zoneId/:hostnameId', authenticateToken, dnsLimiter, async (req: AuthRequest, res) => {
  try {
    const { zoneId, hostnameId } = req.params;

    const cfToken = await AuthService.getUserCfToken(req.user!.id);
    const cfService = new CloudflareService(cfToken);

    await cfService.deleteCustomHostname(zoneId, hostnameId);

    // 记录日志
    await LoggerService.createLog({
      userId: req.user!.id,
      action: 'DELETE',
      resourceType: 'HOSTNAME',
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
    });

    return successResponse(res, null, '自定义主机名删除成功');
  } catch (error: any) {
    // 记录失败日志
    await LoggerService.createLog({
      userId: req.user!.id,
      action: 'DELETE',
      resourceType: 'HOSTNAME',
      status: 'FAILED',
      errorMessage: error.message,
      ipAddress: getClientIp(req),
    });

    return errorResponse(res, error.message, 400);
  }
});

export default router;
