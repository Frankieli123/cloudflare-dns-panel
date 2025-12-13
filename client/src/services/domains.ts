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
  const response = await api.get('/domains', { params });
  return response as unknown as ApiResponse<{ domains: Domain[] }>;
};

/**
 * 获取域名详情
 */
export const getDomainById = async (zoneId: string, credentialId?: number): Promise<ApiResponse<{ domain: any }>> => {
  const params: any = {};
  if (credentialId) {
    params.credentialId = credentialId;
  }
  const response = await api.get(`/domains/${zoneId}`, { params });
  return response as unknown as ApiResponse<{ domain: any }>;
};

/**
 * 刷新域名缓存
 */
export const refreshDomains = async (credentialId?: number | 'all' | null): Promise<ApiResponse> => {
  const params: any = {};
  if (credentialId !== undefined && credentialId !== null) {
    params.credentialId = credentialId;
  }
  const response = await api.post('/domains/refresh', {}, { params });
  return response as unknown as ApiResponse;
};
