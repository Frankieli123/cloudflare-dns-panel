/**
 * DNSPod (腾讯云) DNS Provider
 * - Endpoint: dnspod.tencentcloudapi.com
 * - Service: dnspod
 * - Version: 2021-03-23
 * - Auth: TC3-HMAC-SHA256
 */

import https from 'https';
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
import { buildTc3Headers, Tc3Credentials } from './auth';
import { defaultLines, fromDnspodLine, toDnspodLine } from './lines';

// ========== API 响应类型 ==========

type TcResponse<T> = {
  Response: T & {
    RequestId?: string;
    Error?: { Code: string; Message: string };
  };
};

type DescribeDomainListResponse = TcResponse<{
  DomainList?: Array<{
    DomainId: number;
    Name: string;
    Status?: string;
    RecordCount?: number;
    UpdatedOn?: string;
  }>;
  DomainCountInfo?: { AllTotal?: number };
}>;

type DescribeRecordListResponse = TcResponse<{
  RecordList?: Array<{
    RecordId: number;
    Name: string;
    Type: string;
    Value: string;
    TTL: number;
    MX?: number;
    Weight?: number;
    Status?: 'ENABLE' | 'DISABLE';
    Line?: string;
    Remark?: string;
    UpdatedOn?: string;
  }>;
  RecordCountInfo?: { TotalCount?: number };
}>;

type DescribeRecordResponse = TcResponse<{
  RecordInfo?: {
    RecordId: number;
    Name: string;
    Type: string;
    Value: string;
    TTL: number;
    MX?: number;
    Weight?: number;
    Status?: 'ENABLE' | 'DISABLE';
    Line?: string;
    Remark?: string;
    UpdatedOn?: string;
  };
}>;

type CreateRecordResponse = TcResponse<{ RecordId?: number }>;
type CommonOkResponse = TcResponse<Record<string, unknown>>;

type DescribeRecordLineCategoryListResponse = TcResponse<{
  LineCategoryList?: Array<{
    Name: string;
    LineList?: Array<{ Name: string }>;
  }>;
}>;

// ========== 能力配置 ==========

export const DNSPOD_CAPABILITIES: ProviderCapabilities = {
  provider: ProviderType.DNSPOD,
  name: 'DNSPod (腾讯云)',

  supportsWeight: true,
  supportsLine: true,
  supportsStatus: true,
  supportsRemark: true,
  supportsUrlForward: true,
  supportsLogs: true,

  remarkMode: 'separate',
  paging: 'server',
  requiresDomainId: true,

  recordTypes: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'CAA', 'NS', 'PTR', 'REDIRECT_URL', 'FORWARD_URL'],

  authFields: [
    { name: 'secretId', label: 'SecretId', type: 'text', required: true, placeholder: '输入 SecretId' },
    { name: 'secretKey', label: 'SecretKey', type: 'password', required: true, placeholder: '输入 SecretKey' },
    { name: 'token', label: 'Token (可选)', type: 'password', required: false, placeholder: '临时凭证 Token' },
  ],

  domainCacheTtl: 300,
  recordCacheTtl: 120,

  retryableErrors: ['RequestLimitExceeded', 'InternalError', 'ResourceUnavailable', 'ServerBusy'],
  maxRetries: 3,
};

// ========== Provider 实现 ==========

export class DnspodProvider extends BaseProvider {
  private readonly host = 'dnspod.tencentcloudapi.com';
  private readonly service = 'dnspod';
  private readonly version = '2021-03-23';
  private readonly creds: Tc3Credentials;

  constructor(credentials: ProviderCredentials) {
    super(credentials, DNSPOD_CAPABILITIES);

    const { secretId, secretKey, token } = credentials.secrets || {};
    if (!secretId || !secretKey) {
      throw this.createError('MISSING_CREDENTIALS', '缺少 DNSPod SecretId/SecretKey');
    }

    this.creds = { secretId, secretKey, token };
  }

  private wrapError(err: unknown, code = 'DNSPOD_ERROR'): DnsProviderError {
    if (err instanceof DnsProviderError) return err;
    const message = (err as any)?.message ? String((err as any).message) : String(err);
    return this.createError(code, message, { cause: err });
  }

  private async request<T>(action: string, payload: Record<string, unknown>): Promise<T> {
    const body = JSON.stringify(payload || {});
    const timestamp = Math.floor(Date.now() / 1000);

    const headers = buildTc3Headers(this.creds, {
      host: this.host,
      service: this.service,
      action,
      version: this.version,
      timestamp,
      payload: body,
    });
    headers['Content-Length'] = String(Buffer.byteLength(body));

    return await this.withRetry<T>(() =>
      new Promise<T>((resolve, reject) => {
        const req = https.request(
          { hostname: this.host, method: 'POST', path: '/', headers },
          res => {
            const chunks: Buffer[] = [];
            res.on('data', d => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
            res.on('end', () => {
              const raw = Buffer.concat(chunks).toString('utf8');
              let json: any;

              try {
                json = raw ? JSON.parse(raw) : {};
              } catch (e) {
                reject(this.createError('INVALID_RESPONSE', 'DNSPod 返回非 JSON 响应', { meta: { raw }, cause: e }));
                return;
              }

              const httpStatus = res.statusCode;
              if (httpStatus && httpStatus >= 400) {
                reject(this.createError('HTTP_ERROR', `HTTP 错误: ${httpStatus}`, { httpStatus, meta: { body: json } }));
                return;
              }

              const errObj = json?.Response?.Error;
              if (errObj?.Code) {
                reject(this.createError(String(errObj.Code), String(errObj.Message || 'DNSPod API Error'), {
                  httpStatus,
                  meta: { requestId: json?.Response?.RequestId, action },
                }));
                return;
              }

              resolve(json as T);
            });
          }
        );

        req.on('error', e => {
          reject(this.createError('NETWORK_ERROR', (e as any)?.message || '网络错误', { cause: e }));
        });
        req.write(body);
        req.end();
      })
    );
  }

  private toFqdn(rr: string, domain: string): string {
    if (!rr || rr === '@') return domain;
    if (rr.endsWith(`.${domain}`)) return rr;
    return `${rr}.${domain}`;
  }

  private toRR(name: string, domain: string): string {
    const n = (name || '').trim();
    if (!n || n === '@' || n === domain) return '@';
    if (n.endsWith(`.${domain}`)) {
      return n.slice(0, -(`.${domain}`.length)) || '@';
    }
    return n;
  }

  private fromStatus(status?: 'ENABLE' | 'DISABLE'): '0' | '1' | undefined {
    if (!status) return undefined;
    return status === 'ENABLE' ? '1' : '0';
  }

  private toStatus(enabled: boolean): 'ENABLE' | 'DISABLE' {
    return enabled ? 'ENABLE' : 'DISABLE';
  }

  // ========== IDnsProvider 实现 ==========

  async checkAuth(): Promise<boolean> {
    try {
      await this.request<DescribeDomainListResponse>('DescribeDomainList', { Offset: 0, Limit: 1 });
      return true;
    } catch {
      return false;
    }
  }

  async getZones(page?: number, pageSize?: number, keyword?: string): Promise<ZoneListResult> {
    try {
      const p = Math.max(1, page || 1);
      const ps = Math.max(1, pageSize || 20);
      const offset = (p - 1) * ps;

      const resp = await this.request<DescribeDomainListResponse>('DescribeDomainList', {
        Offset: offset,
        Limit: ps,
        Keyword: keyword,
      });

      const zones: Zone[] = (resp.Response?.DomainList || []).map(d =>
        this.normalizeZone({
          id: String(d.DomainId),
          name: d.Name,
          status: d.Status || 'unknown',
          recordCount: d.RecordCount,
          updatedAt: d.UpdatedOn,
          meta: { raw: d },
        })
      );

      return { total: resp.Response?.DomainCountInfo?.AllTotal || zones.length, zones };
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async getZone(zoneId: string): Promise<Zone> {
    try {
      const idNum = Number(zoneId);
      if (!Number.isFinite(idNum)) {
        throw this.createError('INVALID_ZONE_ID', `DomainId 必须为数字: ${zoneId}`, { httpStatus: 400 });
      }

      // DNSPod 没有单独的 DescribeDomain API，需要遍历查找
      for (let page = 1; page <= 50; page++) {
        const resp = await this.getZones(page, 100);
        const found = resp.zones.find(z => Number(z.id) === idNum);
        if (found) return found;
        if (page * 100 >= resp.total) break;
      }

      throw this.createError('ZONE_NOT_FOUND', `域名不存在: ${zoneId}`, { httpStatus: 404 });
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async getRecords(zoneId: string, params?: RecordQueryParams): Promise<RecordListResult> {
    try {
      const zone = await this.getZone(zoneId);
      const domainId = Number(zone.id);

      const p = Math.max(1, params?.page || 1);
      const ps = Math.max(1, params?.pageSize || 20);
      const offset = (p - 1) * ps;

      const hasFilter = params?.keyword || params?.subDomain || params?.type || params?.value || params?.line || params?.status;
      const action = hasFilter ? 'DescribeRecordFilterList' : 'DescribeRecordList';

      const payload: Record<string, unknown> = { DomainId: domainId, Offset: offset, Limit: ps };

      if (hasFilter) {
        if (params?.keyword) payload.Keyword = params.keyword;
        if (params?.subDomain) payload.SubDomain = this.toRR(params.subDomain, zone.name);
        if (params?.type) payload.RecordType = params.type;
        if (params?.value) payload.Value = params.value;
        if (params?.line) payload.RecordLine = toDnspodLine(params.line);
        if (params?.status) payload.RecordStatus = params.status === '1' ? 'ENABLE' : 'DISABLE';
      }

      const resp = await this.request<DescribeRecordListResponse>(action, payload);

      const records: DnsRecord[] = (resp.Response?.RecordList || []).map(r =>
        this.normalizeRecord({
          id: String(r.RecordId),
          zoneId: zone.id,
          zoneName: zone.name,
          name: this.toFqdn(r.Name, zone.name),
          type: r.Type,
          value: r.Value,
          ttl: r.TTL,
          line: fromDnspodLine(r.Line),
          weight: r.Weight,
          priority: r.MX,
          status: this.fromStatus(r.Status),
          remark: r.Remark,
          updatedAt: r.UpdatedOn,
          meta: { raw: r },
        })
      );

      return { total: resp.Response?.RecordCountInfo?.TotalCount || records.length, records };
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async getRecord(zoneId: string, recordId: string): Promise<DnsRecord> {
    try {
      const zone = await this.getZone(zoneId);
      const rid = Number(recordId);
      if (!Number.isFinite(rid)) {
        throw this.createError('INVALID_RECORD_ID', `RecordId 必须为数字: ${recordId}`, { httpStatus: 400 });
      }

      const resp = await this.request<DescribeRecordResponse>('DescribeRecord', {
        DomainId: Number(zone.id),
        RecordId: rid,
      });

      const info = resp.Response?.RecordInfo;
      if (!info) throw this.createError('NOT_FOUND', `记录不存在: ${recordId}`, { httpStatus: 404 });

      return this.normalizeRecord({
        id: String(info.RecordId),
        zoneId: zone.id,
        zoneName: zone.name,
        name: this.toFqdn(info.Name, zone.name),
        type: info.Type,
        value: info.Value,
        ttl: info.TTL,
        line: fromDnspodLine(info.Line),
        weight: info.Weight,
        priority: info.MX,
        status: this.fromStatus(info.Status),
        remark: info.Remark,
        updatedAt: info.UpdatedOn,
        meta: { raw: info },
      });
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async createRecord(zoneId: string, params: CreateRecordParams): Promise<DnsRecord> {
    try {
      const zone = await this.getZone(zoneId);
      const domainId = Number(zone.id);

      const payload: Record<string, unknown> = {
        DomainId: domainId,
        SubDomain: this.toRR(params.name, zone.name),
        RecordType: params.type,
        RecordLine: toDnspodLine(params.line) || '默认',
        Value: params.value,
        TTL: params.ttl ?? 600,
      };

      if (typeof params.priority === 'number') payload.MX = params.priority;
      if (typeof params.weight === 'number') payload.Weight = params.weight;

      const resp = await this.request<CreateRecordResponse>('CreateRecord', payload);
      const newId = resp.Response?.RecordId;
      if (!newId && newId !== 0) {
        throw this.createError('CREATE_FAILED', '创建记录失败');
      }

      if (params.remark !== undefined) {
        await this.request<CommonOkResponse>('ModifyRecordRemark', {
          DomainId: domainId,
          RecordId: newId,
          Remark: params.remark || '',
        });
      }

      return await this.getRecord(zoneId, String(newId));
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async updateRecord(zoneId: string, recordId: string, params: UpdateRecordParams): Promise<DnsRecord> {
    try {
      const zone = await this.getZone(zoneId);
      const domainId = Number(zone.id);
      const rid = Number(recordId);

      const payload: Record<string, unknown> = {
        DomainId: domainId,
        RecordId: rid,
        SubDomain: this.toRR(params.name, zone.name),
        RecordType: params.type,
        RecordLine: toDnspodLine(params.line) || '默认',
        Value: params.value,
        TTL: params.ttl ?? 600,
      };

      if (typeof params.priority === 'number') payload.MX = params.priority;
      if (typeof params.weight === 'number') payload.Weight = params.weight;

      await this.request<CommonOkResponse>('ModifyRecord', payload);

      if (params.remark !== undefined) {
        await this.request<CommonOkResponse>('ModifyRecordRemark', {
          DomainId: domainId,
          RecordId: rid,
          Remark: params.remark || '',
        });
      }

      return await this.getRecord(zoneId, recordId);
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async deleteRecord(zoneId: string, recordId: string): Promise<boolean> {
    try {
      const zone = await this.getZone(zoneId);
      await this.request<CommonOkResponse>('DeleteRecord', {
        DomainId: Number(zone.id),
        RecordId: Number(recordId),
      });
      return true;
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async setRecordStatus(zoneId: string, recordId: string, enabled: boolean): Promise<boolean> {
    try {
      const zone = await this.getZone(zoneId);
      await this.request<CommonOkResponse>('ModifyRecordStatus', {
        DomainId: Number(zone.id),
        RecordId: Number(recordId),
        Status: this.toStatus(enabled),
      });
      return true;
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async getLines(zoneId?: string): Promise<LineListResult> {
    try {
      if (!zoneId) return { lines: defaultLines() };

      const zone = await this.getZone(zoneId);
      const resp = await this.request<DescribeRecordLineCategoryListResponse>('DescribeRecordLineCategoryList', {
        DomainId: Number(zone.id),
      });

      const dnspodLines = new Set<string>();
      for (const cat of resp.Response?.LineCategoryList || []) {
        for (const line of cat.LineList || []) {
          if (line?.Name) dnspodLines.add(line.Name);
        }
      }

      if (dnspodLines.size === 0) return { lines: defaultLines() };

      const defaults = defaultLines();
      const lines: DnsLine[] = Array.from(dnspodLines).map(name => {
        const generic = fromDnspodLine(name) || name;
        return defaults.find(d => d.code === generic) || { code: generic, name };
      });

      return { lines };
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async getMinTTL(_zoneId?: string): Promise<number> {
    return 60; // DNSPod 付费版支持更低 TTL
  }

  async addZone(domain: string): Promise<Zone> {
    try {
      await this.request<CommonOkResponse>('CreateDomain', { Domain: domain });
      const list = await this.getZones(1, 50, domain);
      const found = list.zones.find(z => z.name.toLowerCase() === domain.toLowerCase());
      if (found) return found;
      throw this.createError('CREATE_DOMAIN_FAILED', '创建域名成功但未能查询到');
    } catch (err) {
      throw this.wrapError(err);
    }
  }
}
