/**
 * PowerDNS Provider
 * - Base URL: http://{ip}:{port}/api/v1
 * - Auth: X-API-Key header
 * - Uses RRSet model with PATCH changetype
 */

import http from 'http';
import { BaseProvider, DnsProviderError } from '../base/BaseProvider';
import {
  CreateRecordParams,
  DnsLine,
  DnsRecord,
  LineListResult,
  ProviderCapabilities,
  ProviderCredentials,
  ProviderType,
  RecordListResult,
  RecordQueryParams,
  UpdateRecordParams,
  Zone,
  ZoneListResult,
} from '../base/types';

interface PowerDnsZone {
  id: string;
  name: string;
  kind?: string;
  serial?: number;
  rrsets?: PowerDnsRRSet[];
}

interface PowerDnsRRSet {
  name: string;
  type: string;
  ttl: number;
  changetype?: string;
  records: PowerDnsRRSetRecord[];
  comments?: { content: string }[];
}

interface PowerDnsRRSetRecord {
  content: string;
  disabled: boolean;
}

export const POWERDNS_CAPABILITIES: ProviderCapabilities = {
  provider: ProviderType.POWERDNS,
  name: 'PowerDNS',

  supportsWeight: false,
  supportsLine: false,
  supportsStatus: true,
  supportsRemark: true,
  supportsUrlForward: false,
  supportsLogs: false,

  remarkMode: 'inline',
  paging: 'client',
  requiresDomainId: false,

  recordTypes: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'CAA', 'NS', 'PTR', 'SOA'],

  authFields: [
    {
      name: 'serverAddress',
      label: '服务器地址',
      type: 'text',
      required: true,
      placeholder: '192.168.1.1:8081',
      helpText: 'PowerDNS API 地址 (IP:端口)',
    },
    { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'PowerDNS API Key' },
  ],

  domainCacheTtl: 60,
  recordCacheTtl: 30,

  retryableErrors: ['TIMEOUT', 'ECONNRESET'],
  maxRetries: 2,
};

export class PowerdnsProvider extends BaseProvider {
  private readonly serverAddress: string;
  private readonly apiKey: string;
  private readonly serverId = 'localhost';

  constructor(credentials: ProviderCredentials) {
    super(credentials, POWERDNS_CAPABILITIES);
    const { serverAddress, apiKey } = credentials.secrets || {};
    if (!serverAddress || !apiKey) throw this.createError('MISSING_CREDENTIALS', '缺少 PowerDNS 服务器地址/API Key');
    this.serverAddress = serverAddress;
    this.apiKey = apiKey;
  }

  private wrapError(err: unknown, code = 'POWERDNS_ERROR'): DnsProviderError {
    if (err instanceof DnsProviderError) return err;
    const message = (err as any)?.message ? String((err as any).message) : String(err);
    return this.createError(code, message, { cause: err });
  }

  private async request<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: any): Promise<T> {
    const payload = body === undefined ? '' : JSON.stringify(body);
    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json; charset=utf-8',
    };
    if (payload) headers['Content-Length'] = String(Buffer.byteLength(payload));

    const [hostname, portStr] = this.serverAddress.split(':');
    const port = Number(portStr || '8081');

    return await this.withRetry<T>(
      () =>
        new Promise<T>((resolve, reject) => {
          const req = http.request({ hostname, port, method, path, headers }, res => {
            const chunks: Buffer[] = [];
            res.on('data', d => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
            res.on('end', () => {
              const raw = Buffer.concat(chunks).toString('utf8');
              // 204 No Content
              if (res.statusCode === 204) {
                resolve({} as T);
                return;
              }
              try {
                const json = raw ? JSON.parse(raw) : {};
                if (res.statusCode && res.statusCode >= 400) {
                  reject(
                    this.createError(
                      String(res.statusCode),
                      json.error || `PowerDNS 错误: ${res.statusCode}`,
                      { httpStatus: res.statusCode, meta: json }
                    )
                  );
                  return;
                }
                resolve(json as T);
              } catch (e) {
                reject(this.createError('INVALID_RESPONSE', 'PowerDNS 返回非 JSON 响应', { meta: { raw }, cause: e }));
              }
            });
          });
          req.on('error', e => reject(this.createError('NETWORK_ERROR', 'PowerDNS 请求失败', { cause: e })));
          if (payload) req.write(payload);
          req.end();
        })
    );
  }

  private ensureTrailingDot(name: string): string {
    return name.endsWith('.') ? name : `${name}.`;
  }

  private removeTrailingDot(name: string): string {
    return name.endsWith('.') ? name.slice(0, -1) : name;
  }

  private recordIdEncode(rrsetName: string, rrsetType: string, recordIndex: number): string {
    return `${rrsetName}|${rrsetType}|${recordIndex}`;
  }

  private recordIdDecode(id: string): { rrsetName: string; rrsetType: string; recordIndex: number } {
    const [rrsetName, rrsetType, indexStr] = id.split('|');
    return { rrsetName, rrsetType, recordIndex: parseInt(indexStr, 10) };
  }

  async checkAuth(): Promise<boolean> {
    try {
      await this.request('GET', `/api/v1/servers/${this.serverId}/zones`);
      return true;
    } catch {
      return false;
    }
  }

  async getZones(page?: number, pageSize?: number, keyword?: string): Promise<ZoneListResult> {
    try {
      const list = await this.request<PowerDnsZone[]>('GET', `/api/v1/servers/${this.serverId}/zones`);

      const zones: Zone[] = list.map(z =>
        this.normalizeZone({
          id: z.id,
          name: this.removeTrailingDot(z.name),
          status: 'active',
        })
      );

      return this.applyZoneQuery(zones, page, pageSize, keyword);
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async getZone(zoneId: string): Promise<Zone> {
    try {
      const zoneIdWithDot = this.ensureTrailingDot(zoneId);
      const z = await this.request<PowerDnsZone>('GET', `/api/v1/servers/${this.serverId}/zones/${zoneIdWithDot}`);
      return this.normalizeZone({
        id: z.id,
        name: this.removeTrailingDot(z.name),
        status: 'active',
      });
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async getRecords(zoneId: string, params?: RecordQueryParams): Promise<RecordListResult> {
    try {
      const zoneIdWithDot = this.ensureTrailingDot(zoneId);
      const z = await this.request<PowerDnsZone>('GET', `/api/v1/servers/${this.serverId}/zones/${zoneIdWithDot}`);
      const zoneName = this.removeTrailingDot(z.name);

      const records: DnsRecord[] = [];
      for (const rrset of z.rrsets || []) {
        // 跳过 SOA 记录
        if (rrset.type === 'SOA') continue;

        rrset.records.forEach((r, idx) => {
          let value = r.content;
          // TXT 记录去除引号
          if (rrset.type === 'TXT' && value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }

          records.push(
            this.normalizeRecord({
              id: this.recordIdEncode(rrset.name, rrset.type, idx),
              zoneId: z.id,
              zoneName: zoneName,
              name: this.removeTrailingDot(rrset.name),
              type: rrset.type,
              value: value,
              ttl: rrset.ttl,
              status: r.disabled ? '0' : '1',
              remark: rrset.comments?.[0]?.content,
            })
          );
        });
      }

      return this.applyRecordQuery(records, params);
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async getRecord(zoneId: string, recordId: string): Promise<DnsRecord> {
    try {
      const result = await this.getRecords(zoneId);
      const record = result.records.find(r => r.id === recordId);
      if (!record) throw this.createError('NOT_FOUND', `记录不存在: ${recordId}`, { httpStatus: 404 });
      return record;
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async createRecord(zoneId: string, params: CreateRecordParams): Promise<DnsRecord> {
    try {
      const zoneIdWithDot = this.ensureTrailingDot(zoneId);
      const zoneName = this.removeTrailingDot(zoneId);
      const rrsetName = this.ensureTrailingDot(
        params.name === '@' ? zoneName : `${params.name}.${zoneName}`
      );

      let content = params.value;
      // TXT 记录添加引号
      if (params.type === 'TXT' && !content.startsWith('"')) {
        content = `"${content}"`;
      }
      // CNAME/MX 添加点
      if ((params.type === 'CNAME' || params.type === 'MX' || params.type === 'NS') && !content.endsWith('.')) {
        content = `${content}.`;
      }
      // MX 记录格式: priority content
      if (params.type === 'MX' && params.priority !== undefined) {
        content = `${params.priority} ${content}`;
      }

      const rrset: PowerDnsRRSet = {
        name: rrsetName,
        type: params.type,
        ttl: params.ttl || 3600,
        changetype: 'REPLACE',
        records: [{ content, disabled: false }],
      };
      if (params.remark) {
        rrset.comments = [{ content: params.remark }];
      }

      await this.request('PATCH', `/api/v1/servers/${this.serverId}/zones/${zoneIdWithDot}`, { rrsets: [rrset] });

      // 返回新创建的记录
      const result = await this.getRecords(zoneId);
      const created = result.records.find(
        r => r.name === this.removeTrailingDot(rrsetName) && r.type === params.type
      );
      if (!created) throw this.createError('CREATE_FAILED', '创建记录失败');
      return created;
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async updateRecord(zoneId: string, recordId: string, params: UpdateRecordParams): Promise<DnsRecord> {
    try {
      // PowerDNS 使用 REPLACE 来更新整个 RRSet
      const { rrsetName } = this.recordIdDecode(recordId);
      const zoneIdWithDot = this.ensureTrailingDot(zoneId);

      let content = params.value;
      if (params.type === 'TXT' && !content.startsWith('"')) {
        content = `"${content}"`;
      }
      if ((params.type === 'CNAME' || params.type === 'MX' || params.type === 'NS') && !content.endsWith('.')) {
        content = `${content}.`;
      }
      if (params.type === 'MX' && params.priority !== undefined) {
        content = `${params.priority} ${content}`;
      }

      const rrset: PowerDnsRRSet = {
        name: rrsetName,
        type: params.type,
        ttl: params.ttl || 3600,
        changetype: 'REPLACE',
        records: [{ content, disabled: false }],
      };
      if (params.remark) {
        rrset.comments = [{ content: params.remark }];
      }

      await this.request('PATCH', `/api/v1/servers/${this.serverId}/zones/${zoneIdWithDot}`, { rrsets: [rrset] });

      return await this.getRecord(zoneId, recordId);
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async deleteRecord(zoneId: string, recordId: string): Promise<boolean> {
    try {
      const { rrsetName, rrsetType } = this.recordIdDecode(recordId);
      const zoneIdWithDot = this.ensureTrailingDot(zoneId);

      const rrset: PowerDnsRRSet = {
        name: rrsetName,
        type: rrsetType,
        ttl: 0,
        changetype: 'DELETE',
        records: [],
      };

      await this.request('PATCH', `/api/v1/servers/${this.serverId}/zones/${zoneIdWithDot}`, { rrsets: [rrset] });
      return true;
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async setRecordStatus(zoneId: string, recordId: string, enabled: boolean): Promise<boolean> {
    try {
      const record = await this.getRecord(zoneId, recordId);
      const { rrsetName, rrsetType } = this.recordIdDecode(recordId);
      const zoneIdWithDot = this.ensureTrailingDot(zoneId);

      let content = record.value;
      if (record.type === 'TXT' && !content.startsWith('"')) {
        content = `"${content}"`;
      }

      const rrset: PowerDnsRRSet = {
        name: rrsetName,
        type: rrsetType,
        ttl: record.ttl,
        changetype: 'REPLACE',
        records: [{ content, disabled: !enabled }],
      };

      await this.request('PATCH', `/api/v1/servers/${this.serverId}/zones/${zoneIdWithDot}`, { rrsets: [rrset] });
      return true;
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async getLines(_zoneId?: string): Promise<LineListResult> {
    const lines: DnsLine[] = [{ code: 'default', name: '默认' }];
    return { lines };
  }

  async getMinTTL(_zoneId?: string): Promise<number> {
    return 60;
  }

  async addZone(domain: string): Promise<Zone> {
    try {
      const domainWithDot = this.ensureTrailingDot(domain);
      const resp = await this.request<PowerDnsZone>('POST', `/api/v1/servers/${this.serverId}/zones`, {
        name: domainWithDot,
        kind: 'Native',
        nameservers: [],
      });
      return this.normalizeZone({
        id: resp.id || domainWithDot,
        name: domain,
        status: 'active',
      });
    } catch (err) {
      throw this.wrapError(err);
    }
  }
}
