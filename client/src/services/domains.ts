import api from './api';
import { ApiResponse, Domain } from '@/types';

/**
 * 获取所有域名列表
 */
export const getDomains = async (): Promise<ApiResponse<{ domains: Domain[] }>> => {
  return api.get('/domains');
};

/**
 * 获取域名详情
 */
export const getDomainById = async (zoneId: string): Promise<ApiResponse<{ domain: any }>> => {
  return api.get(`/domains/${zoneId}`);
};

/**
 * 刷新域名缓存
 */
export const refreshDomains = async (): Promise<ApiResponse> => {
  return api.post('/domains/refresh');
};
