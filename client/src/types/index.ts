/**
 * 用户类型
 */
export interface User {
  id: number;
  username: string;
  email?: string | null;
  cfAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

/**
 * DNS 记录类型
 */
export type DNSRecordType =
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'MX'
  | 'TXT'
  | 'SRV'
  | 'CAA'
  | 'NS'
  | 'PTR';

/**
 * DNS 记录
 */
export interface DNSRecord {
  id: string;
  type: DNSRecordType;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  priority?: number;
}

/**
 * 域名
 */
export interface Domain {
  id: string;
  name: string;
  status: string;
  recordCount?: number;
  updatedAt?: string;
}

/**
 * 操作日志
 */
export interface Log {
  id: number;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  resourceType: 'DNS' | 'ZONE' | 'HOSTNAME' | 'USER';
  domain?: string;
  recordName?: string;
  recordType?: string;
  oldValue?: string;
  newValue?: string;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  ipAddress?: string;
}

/**
 * 自定义主机名
 */
export interface CustomHostname {
  id: string;
  hostname: string;
  status?: string;
  ssl: {
    status: string;
    method: string;
    type: string;
    validation_records?: {
      txt_name?: string;
      txt_value?: string;
    }[];
    validation_errors?: any[];
  };
  ownership_verification?: {
    type: string;
    name: string;
    value: string;
  };
  created_at: string;
}

/**
 * API 响应
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
