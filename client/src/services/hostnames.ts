import api from './api';
import { ApiResponse, CustomHostname } from '@/types';

/**
 * 获取自定义主机名列表
 */
export const getCustomHostnames = async (
  zoneId: string,
  credentialId?: number
): Promise<ApiResponse<{ hostnames: CustomHostname[] }>> => {
  const params = credentialId !== undefined ? { credentialId } : {};
  return api.get(`/hostnames/${zoneId}`, { params });
};

/**
 * 创建自定义主机名
 */
export const createCustomHostname = async (
  zoneId: string,
  hostname: string,
  credentialId?: number
): Promise<ApiResponse<{ hostname: CustomHostname }>> => {
  const params = credentialId !== undefined ? { credentialId } : {};
  return api.post(`/hostnames/${zoneId}`, { hostname }, { params });
};

/**
 * 删除自定义主机名
 */
export const deleteCustomHostname = async (
  zoneId: string,
  hostnameId: string,
  credentialId?: number
): Promise<ApiResponse> => {
  const params = credentialId !== undefined ? { credentialId } : {};
  return api.delete(`/hostnames/${zoneId}/${hostnameId}`, { params });
};

/**
 * 获取自定义主机名回退源
 */
export const getFallbackOrigin = async (
  zoneId: string,
  credentialId?: number
): Promise<ApiResponse<{ origin: string }>> => {
  const params = credentialId !== undefined ? { credentialId } : {};
  return api.get(`/hostnames/${zoneId}/fallback_origin`, { params });
};

/**
 * 更新自定义主机名回退源
 */
export const updateFallbackOrigin = async (
  zoneId: string,
  origin: string,
  credentialId?: number
): Promise<ApiResponse<{ origin: string }>> => {
  const params = credentialId !== undefined ? { credentialId } : {};
  return api.put(`/hostnames/${zoneId}/fallback_origin`, { origin }, { params });
};
