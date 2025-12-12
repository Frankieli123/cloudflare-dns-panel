import api from './api';
import { ApiResponse, DNSRecord } from '@/types';

/**
 * 获取 DNS 记录列表
 */
export const getDNSRecords = async (
  zoneId: string
): Promise<ApiResponse<{ records: DNSRecord[] }>> => {
  return api.get(`/dns/${zoneId}/records`);
};

/**
 * 创建 DNS 记录
 */
export const createDNSRecord = async (
  zoneId: string,
  params: {
    type: string;
    name: string;
    content: string;
    ttl?: number;
    proxied?: boolean;
    priority?: number;
  }
): Promise<ApiResponse<{ record: DNSRecord }>> => {
  return api.post(`/dns/${zoneId}/records`, params);
};

/**
 * 更新 DNS 记录
 */
export const updateDNSRecord = async (
  zoneId: string,
  recordId: string,
  params: {
    type?: string;
    name?: string;
    content?: string;
    ttl?: number;
    proxied?: boolean;
    priority?: number;
  }
): Promise<ApiResponse<{ record: DNSRecord }>> => {
  return api.put(`/dns/${zoneId}/records/${recordId}`, params);
};

/**
 * 删除 DNS 记录
 */
export const deleteDNSRecord = async (
  zoneId: string,
  recordId: string
): Promise<ApiResponse> => {
  return api.delete(`/dns/${zoneId}/records/${recordId}`);
};
