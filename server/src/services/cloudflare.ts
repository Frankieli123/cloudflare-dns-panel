import Cloudflare from 'cloudflare';
import NodeCache from 'node-cache';
import { config } from '../config';
import { DNSRecord, Domain } from '../types';

const cache = new NodeCache();

/**
 * Cloudflare 服务
 */
export class CloudflareService {
  private client: Cloudflare;

  constructor(apiToken: string) {
    this.client = new Cloudflare({ apiToken });
  }

  /**
   * 获取所有域名（Zones）
   */
  async getDomains(): Promise<Domain[]> {
    const cacheKey = 'domains';
    const cached = cache.get<Domain[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await this.client.zones.list();
      const domains: Domain[] = response.result.map((zone: any) => ({
        id: zone.id,
        name: zone.name,
        status: zone.status,
        updatedAt: zone.modified_on,
      }));

      cache.set(cacheKey, domains, config.cache.domainsTTL);
      return domains;
    } catch (error: any) {
      throw new Error(`获取域名列表失败: ${error.message}`);
    }
  }

  /**
   * 获取域名详情
   */
  async getDomainById(zoneId: string): Promise<any> {
    try {
      const response = await this.client.zones.get({ zone_id: zoneId });
      return response;
    } catch (error: any) {
      throw new Error(`获取域名详情失败: ${error.message}`);
    }
  }

  /**
   * 获取 DNS 记录列表
   */
  async getDNSRecords(zoneId: string): Promise<DNSRecord[]> {
    const cacheKey = `dns_records_${zoneId}`;
    const cached = cache.get<DNSRecord[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await this.client.dns.records.list({ zone_id: zoneId });
      const records: DNSRecord[] = response.result.map((record: any) => ({
        id: record.id,
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl,
        proxied: record.proxied || false,
        priority: record.priority,
      }));

      cache.set(cacheKey, records, config.cache.recordsTTL);
      return records;
    } catch (error: any) {
      throw new Error(`获取 DNS 记录失败: ${error.message}`);
    }
  }

  /**
   * 创建 DNS 记录
   */
  async createDNSRecord(
    zoneId: string,
    params: {
      type: string;
      name: string;
      content: string;
      ttl?: number;
      proxied?: boolean;
      priority?: number;
    }
  ): Promise<DNSRecord> {
    try {
      const response = await this.client.dns.records.create({
        zone_id: zoneId,
        type: params.type as any,
        name: params.name,
        content: params.content,
        ttl: params.ttl || 1,
        proxied: params.proxied,
        priority: params.priority,
      } as any);

      // 清除缓存
      cache.del(`dns_records_${zoneId}`);

      return {
        id: response.id,
        type: response.type as any,
        name: response.name,
        content: response.content,
        ttl: response.ttl,
        proxied: response.proxied || false,
        priority: response.priority,
      };
    } catch (error: any) {
      throw new Error(`创建 DNS 记录失败: ${error.message}`);
    }
  }

  /**
   * 更新 DNS 记录
   */
  async updateDNSRecord(
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
  ): Promise<DNSRecord> {
    try {
      const response = await this.client.dns.records.update(recordId, {
        zone_id: zoneId,
        ...params,
      } as any);

      // 清除缓存
      cache.del(`dns_records_${zoneId}`);

      return {
        id: response.id,
        type: response.type as any,
        name: response.name,
        content: response.content,
        ttl: response.ttl,
        proxied: response.proxied || false,
        priority: response.priority,
      };
    } catch (error: any) {
      throw new Error(`更新 DNS 记录失败: ${error.message}`);
    }
  }

  /**
   * 删除 DNS 记录
   */
  async deleteDNSRecord(zoneId: string, recordId: string): Promise<void> {
    try {
      await this.client.dns.records.delete(recordId, { zone_id: zoneId });

      // 清除缓存
      cache.del(`dns_records_${zoneId}`);
    } catch (error: any) {
      throw new Error(`删除 DNS 记录失败: ${error.message}`);
    }
  }

  /**
   * 获取自定义主机名列表
   */
  async getCustomHostnames(zoneId: string): Promise<any[]> {
    try {
      const response = await this.client.customHostnames.list({ zone_id: zoneId });
      return response.result;
    } catch (error: any) {
      throw new Error(`获取自定义主机名失败: ${error.message}`);
    }
  }

  /**
   * 创建自定义主机名
   */
  async createCustomHostname(zoneId: string, hostname: string): Promise<any> {
    try {
      const response = await this.client.customHostnames.create({
        zone_id: zoneId,
        hostname,
        ssl: { method: 'http', type: 'dv' },
      });

      return response;
    } catch (error: any) {
      throw new Error(`创建自定义主机名失败: ${error.message}`);
    }
  }

  /**
   * 删除自定义主机名
   */
  async deleteCustomHostname(zoneId: string, hostnameId: string): Promise<void> {
    try {
      await this.client.customHostnames.delete(hostnameId, { zone_id: zoneId });
    } catch (error: any) {
      throw new Error(`删除自定义主机名失败: ${error.message}`);
    }
  }

  /**
   * 获取自定义主机名回退源
   */
  async getFallbackOrigin(zoneId: string): Promise<string> {
    try {
      // @ts-ignore
      const response = await this.client.customHostnames.fallbackOrigin.get({ zone_id: zoneId });
      return response.origin || '';
    } catch (error: any) {
      // 某些情况下未设置返回空或404，视具体 API 表现而定
      return '';
    }
  }

  /**
   * 更新自定义主机名回退源
   */
  async updateFallbackOrigin(zoneId: string, origin: string): Promise<string> {
    try {
      // @ts-ignore
      const response = await this.client.customHostnames.fallbackOrigin.update({
        zone_id: zoneId,
        origin
      });
      return response.origin;
    } catch (error: any) {
      throw new Error(`更新回退源失败: ${error.message}`);
    }
  }

  /**
   * 清除缓存
   */
  clearCache(key?: string) {
    if (key) {
      cache.del(key);
    } else {
      cache.flushAll();
    }
  }
}
