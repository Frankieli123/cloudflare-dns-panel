import api from './api';
import { ApiResponse, DNSRecord } from '@/types';

/**
 * 获取 DNS 记录列表
 */
export const getDNSRecords = async (
  zoneId: string,
  credentialId?: number
): Promise<ApiResponse<{ records: DNSRecord[] }>> => {
  const params = credentialId !== undefined ? { credentialId } : {};

  const response = await api.get(`/dns-records/zones/${zoneId}/records`, {
    params: {
      ...params,
      page: 1,
      pageSize: 5000,
    },
  });

  const rawRecords = (response as any)?.data?.records || [];
  const records: DNSRecord[] = rawRecords.map((r: any) => ({
    id: r.id,
    type: r.type,
    name: r.name,
    content: r.value,
    ttl: r.ttl,
    proxied: !!r.proxied,
    priority: r.priority,
  }));

  return {
    ...(response as any),
    data: {
      ...(response as any)?.data,
      records,
    },
  } as ApiResponse<{ records: DNSRecord[] }>;
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
  },
  credentialId?: number
): Promise<ApiResponse<{ record: DNSRecord }>> => {
  const queryParams = credentialId !== undefined ? { credentialId } : {};

  const response = await api.post(
    `/dns-records/zones/${zoneId}/records`,
    {
      name: params.name,
      type: params.type,
      value: params.content,
      ttl: params.ttl,
      proxied: params.proxied,
      priority: params.priority,
    },
    { params: queryParams }
  );

  const r = (response as any)?.data?.record;
  const record: DNSRecord | null = r
    ? {
        id: r.id,
        type: r.type,
        name: r.name,
        content: r.value,
        ttl: r.ttl,
        proxied: !!r.proxied,
        priority: r.priority,
      }
    : null;

  return {
    ...(response as any),
    data: {
      ...(response as any)?.data,
      record,
    },
  } as ApiResponse<{ record: DNSRecord }>;
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
  },
  credentialId?: number
): Promise<ApiResponse<{ record: DNSRecord }>> => {
  const queryParams = credentialId !== undefined ? { credentialId } : {};

  const response = await api.put(
    `/dns-records/zones/${zoneId}/records/${recordId}`,
    {
      name: params.name,
      type: params.type,
      value: params.content,
      ttl: params.ttl,
      proxied: params.proxied,
      priority: params.priority,
    },
    { params: queryParams }
  );

  const r = (response as any)?.data?.record;
  const record: DNSRecord | null = r
    ? {
        id: r.id,
        type: r.type,
        name: r.name,
        content: r.value,
        ttl: r.ttl,
        proxied: !!r.proxied,
        priority: r.priority,
      }
    : null;

  return {
    ...(response as any),
    data: {
      ...(response as any)?.data,
      record,
    },
  } as ApiResponse<{ record: DNSRecord }>;
};

/**
 * 删除 DNS 记录
 */
export const deleteDNSRecord = async (
  zoneId: string,
  recordId: string,
  credentialId?: number
): Promise<ApiResponse> => {
  const params = credentialId !== undefined ? { credentialId } : {};
  return api.delete(`/dns-records/zones/${zoneId}/records/${recordId}`, { params });
};
