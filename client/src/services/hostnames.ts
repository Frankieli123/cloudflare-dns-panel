import api from './api';
import { ApiResponse, CustomHostname } from '@/types';

/**
 * 获取自定义主机名列表
 */
export const getCustomHostnames = async (
  zoneId: string
): Promise<ApiResponse<{ hostnames: CustomHostname[] }>> => {
  return api.get(`/hostnames/${zoneId}`);
};

/**
 * 创建自定义主机名
 */
export const createCustomHostname = async (
  zoneId: string,
  hostname: string
): Promise<ApiResponse<{ hostname: CustomHostname }>> => {
  return api.post(`/hostnames/${zoneId}`, { hostname });
};

/**
 * 删除自定义主机名
 */
export const deleteCustomHostname = async (
  zoneId: string,
  hostnameId: string
): Promise<ApiResponse> => {
  return api.delete(`/hostnames/${zoneId}/${hostnameId}`);
};

/**
 * 获取自定义主机名回退源
 */
export const getFallbackOrigin = async (
  zoneId: string
): Promise<ApiResponse<{ origin: string }>> => {
  return api.get(`/hostnames/${zoneId}/fallback_origin`);
};

/**
 * 更新自定义主机名回退源
 */
export const updateFallbackOrigin = async (
  zoneId: string,
  origin: string
): Promise<ApiResponse<{ origin: string }>> => {
  return api.put(`/hostnames/${zoneId}/fallback_origin`, { origin });
};
