/**
 * DNS 凭证路由 - 支持多提供商
 * 替代原有的 credentials.ts (仅支持 Cloudflare)
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';
import { successResponse, errorResponse } from '../utils/response';
import { createLog } from '../services/logger';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import { ProviderRegistry } from '../providers/ProviderRegistry';
import { ProviderType } from '../providers/base/types';
import { dnsService } from '../services/dns/DnsService';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

/**
 * GET /api/dns-credentials/providers
 * 获取所有支持的提供商及其配置
 */
router.get('/providers', async (_req, res) => {
  try {
    const capabilities = ProviderRegistry.getAllCapabilities();
    return successResponse(res, { providers: capabilities }, '获取提供商列表成功');
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
});

/**
 * GET /api/dns-credentials
 * 获取当前用户的所有凭证
 */
router.get('/', async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.id;

    const credentials = await prisma.dnsCredential.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        provider: true,
        accountId: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 添加提供商显示名称
    const credentialsWithMeta = credentials.map(cred => {
      const caps = ProviderRegistry.getCapabilities(cred.provider as ProviderType);
      return {
        ...cred,
        providerName: caps?.name || cred.provider,
      };
    });

    return successResponse(res, { credentials: credentialsWithMeta }, '获取凭证列表成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '获取凭证列表失败', 500);
  }
});

/**
 * POST /api/dns-credentials
 * 创建新凭证
 */
router.post('/', async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const { name, provider, secrets, accountId } = req.body;

    if (!name || !provider || !secrets) {
      return errorResponse(res, '缺少必需参数: name, provider, secrets', 400);
    }

    // 验证提供商是否支持
    if (!ProviderRegistry.isSupported(provider as ProviderType)) {
      return errorResponse(res, `不支持的提供商: ${provider}`, 400);
    }

    // 不再强制验证凭证，实际使用时会自然暴露问题

    // 加密 secrets
    const encryptedSecrets = encrypt(JSON.stringify(secrets));

    // 检查是否是第一个凭证
    const existingCount = await prisma.dnsCredential.count({ where: { userId } });

    const credential = await prisma.dnsCredential.create({
      data: {
        userId,
        name,
        provider,
        secrets: encryptedSecrets,
        accountId,
        isDefault: existingCount === 0,
      },
      select: {
        id: true,
        name: true,
        provider: true,
        accountId: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createLog({
      userId,
      action: 'CREATE',
      resourceType: 'CREDENTIAL',
      status: 'SUCCESS',
      ipAddress: req.ip,
      newValue: JSON.stringify({ name, provider, accountId }),
    });

    const caps = ProviderRegistry.getCapabilities(provider as ProviderType);
    return successResponse(res, {
      credential: { ...credential, providerName: caps?.name || provider },
    }, '凭证创建成功', 201);
  } catch (error: any) {
    return errorResponse(res, error.message || '创建凭证失败', 500);
  }
});

/**
 * PUT /api/dns-credentials/:id
 * 更新凭证
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const credentialId = parseInt(req.params.id);
    const { name, secrets, accountId, isDefault } = req.body;

    const existing = await prisma.dnsCredential.findFirst({
      where: { id: credentialId, userId },
    });

    if (!existing) {
      return errorResponse(res, '凭证不存在', 404);
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (accountId !== undefined) updateData.accountId = accountId;

    // 更新 secrets 时不再强制验证
    if (secrets) {
      updateData.secrets = encrypt(JSON.stringify(secrets));
    }

    // 设置默认凭证
    if (isDefault === true) {
      await prisma.dnsCredential.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
      updateData.isDefault = true;
    }

    const credential = await prisma.dnsCredential.update({
      where: { id: credentialId },
      data: updateData,
      select: {
        id: true,
        name: true,
        provider: true,
        accountId: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 如果更新了 secrets，清除 DnsService 缓存的 Provider 实例
    if (secrets) {
      dnsService.clearAllCache();
    }

    await createLog({
      userId,
      action: 'UPDATE',
      resourceType: 'CREDENTIAL',
      status: 'SUCCESS',
      ipAddress: req.ip,
      oldValue: JSON.stringify({ name: existing.name }),
      newValue: JSON.stringify({ name: credential.name }),
    });

    const caps = ProviderRegistry.getCapabilities(credential.provider as ProviderType);
    return successResponse(res, {
      credential: { ...credential, providerName: caps?.name || credential.provider },
    }, '凭证更新成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '更新凭证失败', 500);
  }
});

/**
 * DELETE /api/dns-credentials/:id
 * 删除凭证
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const credentialId = parseInt(req.params.id);

    const existing = await prisma.dnsCredential.findFirst({
      where: { id: credentialId, userId },
    });

    if (!existing) {
      return errorResponse(res, '凭证不存在', 404);
    }

    await prisma.dnsCredential.delete({ where: { id: credentialId } });

    // 如果删除的是默认凭证，设置新的默认
    if (existing.isDefault) {
      const first = await prisma.dnsCredential.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      if (first) {
        await prisma.dnsCredential.update({
          where: { id: first.id },
          data: { isDefault: true },
        });
      }
    }

    await createLog({
      userId,
      action: 'DELETE',
      resourceType: 'CREDENTIAL',
      status: 'SUCCESS',
      ipAddress: req.ip,
      oldValue: JSON.stringify({ name: existing.name, provider: existing.provider }),
    });

    return successResponse(res, null, '凭证删除成功');
  } catch (error: any) {
    return errorResponse(res, error.message || '删除凭证失败', 500);
  }
});

/**
 * POST /api/dns-credentials/:id/verify
 * 验证凭证有效性
 */
router.post('/:id/verify', async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.id;
    const credentialId = parseInt(req.params.id);

    const credential = await prisma.dnsCredential.findFirst({
      where: { id: credentialId, userId },
    });

    if (!credential) {
      return errorResponse(res, '凭证不存在', 404);
    }

    const secrets = JSON.parse(decrypt(credential.secrets));
    const providerInstance = ProviderRegistry.createProvider({
      provider: credential.provider as ProviderType,
      secrets,
      accountId: credential.accountId || undefined,
      encrypted: false,
    });

    const isValid = await providerInstance.checkAuth();
    return successResponse(res, { valid: isValid }, isValid ? '凭证验证成功' : '凭证验证失败');
  } catch (error: any) {
    return successResponse(res, { valid: false, error: error.message }, '凭证验证失败');
  }
});

export default router;
