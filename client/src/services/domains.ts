import api from './api';
import { ApiResponse, Domain } from '@/types';

/**
 * 获取所有域名列表
 * @param credentialId 可选，指定凭证ID，或 'all' 获取所有
 */
export const getDomains = async (credentialId?: number | 'all' | null): Promise<ApiResponse<{ domains: Domain[] }>> => {
  const params: any = {};
  if (credentialId !== undefined && credentialId !== null) {
    params.credentialId = credentialId;
  }
  const response = await api.get('/dns-records/zones', {
    params: {
      ...params,
      page: 1,
      pageSize: 5000,
    },
  });

  const zones = (response as any)?.data?.zones || [];
  const credId = typeof credentialId === 'number' ? credentialId : undefined;
  const domains: Domain[] = zones.map((z: any) => ({
    id: z.id,
    name: z.name,
    status: z.status,
    recordCount: z.recordCount,
    updatedAt: z.updatedAt,
    credentialId: credId,
  }));

  return {
    ...(response as any),
    data: {
      ...(response as any)?.data,
      domains,
    },
  } as ApiResponse<{ domains: Domain[] }>;
};

/**
 * 获取域名详情
 */
export const getDomainById = async (zoneId: string, credentialId?: number): Promise<ApiResponse<{ domain: any }>> => {
  const params: any = {};
  if (credentialId) {
    params.credentialId = credentialId;
  }

  const response = await api.get(`/dns-records/zones/${zoneId}`, { params });
  const zone = (response as any)?.data?.zone;
  const domain = zone
    ? {
        id: zone.id,
        name: zone.name,
        status: zone.status,
        recordCount: zone.recordCount,
        updatedAt: zone.updatedAt,
      }
    : null;

  return {
    ...(response as any),
    data: {
      ...(response as any)?.data,
      domain,
    },
  } as ApiResponse<{ domain: any }>;
};

/**
 * 刷新域名缓存
 */
export const refreshDomains = async (credentialId?: number | 'all' | null): Promise<ApiResponse> => {
  const params: any = {};
  if (credentialId !== undefined && credentialId !== null) {
    params.credentialId = credentialId;
  }
  const response = await api.post('/dns-records/refresh', {}, { params });
  return response as unknown as ApiResponse;
};
