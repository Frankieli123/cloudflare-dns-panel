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
 * GET /api/dns/:zoneId/records
 * 获取 DNS 记录列表
 */
router.get('/:zoneId/records', authenticateToken, generalLimiter, async (req: AuthRequest, res) => {
  try {
    const { zoneId } = req.params;

    const cfToken = await AuthService.getUserCfToken(req.user!.id);
    const cfService = new CloudflareService(cfToken);

    const records = await cfService.getDNSRecords(zoneId);

    return successResponse(res, { records }, '获取 DNS 记录成功');
  } catch (error: any) {
    return errorResponse(res, error.message, 400);
  }
});

/**
 * POST /api/dns/:zoneId/records
 * 创建 DNS 记录
 */
router.post('/:zoneId/records', authenticateToken, dnsLimiter, async (req: AuthRequest, res) => {
  try {
    const { zoneId } = req.params;
    const { type, name, content, ttl, proxied, priority } = req.body;

    if (!type || !name || !content) {
      return errorResponse(res, '缺少必需参数', 400);
    }

    const cfToken = await AuthService.getUserCfToken(req.user!.id);
    const cfService = new CloudflareService(cfToken);

    const record = await cfService.createDNSRecord(zoneId, {
      type,
      name,
      content,
      ttl,
      proxied,
      priority,
    });

    // 记录日志
    await LoggerService.createLog({
      userId: req.user!.id,
      action: 'CREATE',
      resourceType: 'DNS',
      recordName: name,
      recordType: type,
      newValue: JSON.stringify({ content, ttl, proxied }),
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
    });

    return successResponse(res, { record }, 'DNS 记录创建成功', 201);
  } catch (error: any) {
    // 记录失败日志
    await LoggerService.createLog({
      userId: req.user!.id,
      action: 'CREATE',
      resourceType: 'DNS',
      recordName: req.body.name,
      recordType: req.body.type,
      status: 'FAILED',
      errorMessage: error.message,
      ipAddress: getClientIp(req),
    });

    return errorResponse(res, error.message, 400);
  }
});

/**
 * PUT /api/dns/:zoneId/records/:recordId
 * 更新 DNS 记录
 */
router.put('/:zoneId/records/:recordId', authenticateToken, dnsLimiter, async (req: AuthRequest, res) => {
  try {
    const { zoneId, recordId } = req.params;
    const { type, name, content, ttl, proxied, priority } = req.body;

    const cfToken = await AuthService.getUserCfToken(req.user!.id);
    const cfService = new CloudflareService(cfToken);

    // 获取旧记录
    const oldRecords = await cfService.getDNSRecords(zoneId);
    const oldRecord = oldRecords.find((r) => r.id === recordId);

    const record = await cfService.updateDNSRecord(zoneId, recordId, {
      type,
      name,
      content,
      ttl,
      proxied,
      priority,
    });

    // 记录日志
    await LoggerService.createLog({
      userId: req.user!.id,
      action: 'UPDATE',
      resourceType: 'DNS',
      recordName: name || oldRecord?.name,
      recordType: type || oldRecord?.type,
      oldValue: oldRecord ? JSON.stringify(oldRecord) : undefined,
      newValue: JSON.stringify({ content, ttl, proxied }),
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
    });

    return successResponse(res, { record }, 'DNS 记录更新成功');
  } catch (error: any) {
    // 记录失败日志
    await LoggerService.createLog({
      userId: req.user!.id,
      action: 'UPDATE',
      resourceType: 'DNS',
      status: 'FAILED',
      errorMessage: error.message,
      ipAddress: getClientIp(req),
    });

    return errorResponse(res, error.message, 400);
  }
});

/**
 * DELETE /api/dns/:zoneId/records/:recordId
 * 删除 DNS 记录
 */
router.delete('/:zoneId/records/:recordId', authenticateToken, dnsLimiter, async (req: AuthRequest, res) => {
  try {
    const { zoneId, recordId } = req.params;

    const cfToken = await AuthService.getUserCfToken(req.user!.id);
    const cfService = new CloudflareService(cfToken);

    // 获取记录信息用于日志
    const records = await cfService.getDNSRecords(zoneId);
    const record = records.find((r) => r.id === recordId);

    await cfService.deleteDNSRecord(zoneId, recordId);

    // 记录日志
    await LoggerService.createLog({
      userId: req.user!.id,
      action: 'DELETE',
      resourceType: 'DNS',
      recordName: record?.name,
      recordType: record?.type,
      oldValue: record ? JSON.stringify(record) : undefined,
      status: 'SUCCESS',
      ipAddress: getClientIp(req),
    });

    return successResponse(res, null, 'DNS 记录删除成功');
  } catch (error: any) {
    // 记录失败日志
    await LoggerService.createLog({
      userId: req.user!.id,
      action: 'DELETE',
      resourceType: 'DNS',
      status: 'FAILED',
      errorMessage: error.message,
      ipAddress: getClientIp(req),
    });

    return errorResponse(res, error.message, 400);
  }
});

export default router;
