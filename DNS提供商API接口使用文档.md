# DNS提供商API接口使用文档

本文档详细分析了项目中所有域名提供商的API接口使用方式，便于在其他项目中复用。

## 目录

- [接口规范](#接口规范)
- [DNS提供商列表](#dns提供商列表)
- [各提供商详细说明](#各提供商详细说明)
  - [1. 阿里云](#1-阿里云)
  - [2. 腾讯云/DNSPod](#2-腾讯云dnspod)
  - [3. 华为云](#3-华为云)
  - [4. 百度云](#4-百度云)
  - [5. 西部数码](#5-西部数码)
  - [6. 火山引擎](#6-火山引擎)
  - [7. 京东云](#7-京东云)
  - [8. DNSLA](#8-dnsla)
  - [9. Cloudflare](#9-cloudflare)
  - [10. NameSilo](#10-namesilo)
  - [11. PowerDNS](#11-powerdns)
  - [12. Spaceship](#12-spaceship)
- [通用接口方法说明](#通用接口方法说明)
- [使用示例](#使用示例)

---

## 接口规范

所有DNS提供商都实现了 `DnsInterface` 接口，包含以下方法：

```php
interface DnsInterface
{
    function getError();                                    // 获取错误信息
    function check();                                       // 检查认证是否有效
    function getDomainList($KeyWord = null, $PageNumber = 1, $PageSize = 20);  // 获取域名列表
    function getDomainRecords($PageNumber = 1, $PageSize = 20, $KeyWord = null, $SubDomain = null, $Value = null, $Type = null, $Line = null, $Status = null);  // 获取解析记录列表
    function getSubDomainRecords($SubDomain, $PageNumber = 1, $PageSize = 20, $Type = null, $Line = null);  // 获取子域名解析记录列表
    function getDomainRecordInfo($RecordId);               // 获取解析记录详细信息
    function addDomainRecord($Name, $Type, $Value, $Line = 'default', $TTL = 600, $MX = 1, $Weight = null, $Remark = null);  // 添加解析记录
    function updateDomainRecord($RecordId, $Name, $Type, $Value, $Line = 'default', $TTL = 600, $MX = 1, $Weight = null, $Remark = null);  // 修改解析记录
    function updateDomainRecordRemark($RecordId, $Remark); // 修改解析记录备注
    function deleteDomainRecord($RecordId);                // 删除解析记录
    function setDomainRecordStatus($RecordId, $Status);    // 设置解析记录状态
    function getDomainRecordLog($PageNumber = 1, $PageSize = 20, $KeyWord = null, $StartDate = null, $endDate = null);  // 获取解析记录操作日志
    function getRecordLine();                              // 获取解析线路列表
    function getMinTTL();                                  // 获取域名最低TTL
    function addDomain($Domain);                           // 添加域名
}
```

---

## DNS提供商列表

| 提供商 | 代码 | 认证方式 | 备注支持 | 状态支持 | 转发支持 | 日志支持 | 权重支持 | 分页方式 | 添加域名 |
|--------|------|----------|----------|----------|----------|----------|----------|----------|----------|
| 阿里云 | aliyun | AccessKeyId/AccessKeySecret | 单独设置 | ✅ | ✅ | ✅ | ❌ | 服务端 | ✅ |
| 腾讯云 | dnspod | SecretId/SecretKey | 单独设置 | ✅ | ✅ | ✅ | ✅ | 服务端 | ✅ |
| 华为云 | huawei | AccessKeyId/SecretAccessKey | 一起设置 | ✅ | ❌ | ❌ | ✅ | 服务端 | ✅ |
| 百度云 | baidu | AccessKey/SecretKey | 一起设置 | ❌ | ❌ | ❌ | ❌ | 客户端 | ✅ |
| 西部数码 | west | 用户名/API密码 | 不支持 | ✅ | ❌ | ❌ | ❌ | 服务端 | ❌ |
| 火山引擎 | huoshan | AccessKeyId/SecretAccessKey | 一起设置 | ✅ | ❌ | ❌ | ✅ | 服务端 | ✅ |
| 京东云 | jdcloud | AccessKeyId/AccessKeySecret | 不支持 | ✅ | ✅ | ❌ | ✅ | 服务端 | ✅ |
| DNSLA | dnsla | APIID/API密钥 | 不支持 | ✅ | ✅ | ❌ | ✅ | 服务端 | ✅ |
| Cloudflare | cloudflare | 邮箱/API密钥或令牌 | 一起设置 | ✅ | ❌ | ❌ | ❌ | 服务端 | ✅ |
| NameSilo | namesilo | API Key | 不支持 | ❌ | ❌ | ❌ | ❌ | 客户端 | ❌ |
| PowerDNS | powerdns | IP:端口/API KEY | 一起设置 | ✅ | ❌ | ❌ | ❌ | 客户端 | ✅ |
| Spaceship | spaceship | AccessKey/SecretKey | 不支持 | ❌ | ✅ | ❌ | ❌ | 服务端 | ✅ |

---

## 各提供商详细说明

### 1. 阿里云

**配置文件：** `app/lib/dns/aliyun.php`  
**客户端类：** `app/lib/client/Aliyun.php`

#### 认证信息
- **AccessKeyId**: AccessKey ID
- **AccessKeySecret**: AccessKey Secret
- **Endpoint**: `alidns.aliyuncs.com`
- **API版本**: `2015-01-09`

#### 认证方式
使用 HMAC-SHA1 签名算法，遵循阿里云标准签名规范。

#### 主要API端点

| 操作 | Action | 方法 | 说明 |
|------|--------|------|------|
| 获取域名列表 | DescribeDomains | POST | 支持关键词搜索、分页 |
| 获取解析记录 | DescribeDomainRecords | POST | 支持高级搜索模式 |
| 获取子域名记录 | DescribeSubDomainRecords | POST | 获取指定子域名的所有记录 |
| 获取记录详情 | DescribeDomainRecordInfo | POST | 根据RecordId获取 |
| 添加记录 | AddDomainRecord | POST | 返回RecordId |
| 修改记录 | UpdateDomainRecord | POST | 修改记录内容 |
| 修改备注 | UpdateDomainRecordRemark | POST | 单独修改备注 |
| 删除记录 | DeleteDomainRecord | POST | 根据RecordId删除 |
| 设置状态 | SetDomainRecordStatus | POST | Enable/Disable |
| 获取日志 | DescribeRecordLogs | POST | 操作日志 |
| 获取线路 | DescribeDomainInfo | POST | 获取域名信息和线路列表 |
| 添加域名 | AddDomain | POST | 添加新域名 |

#### 特殊处理
- **线路转换**: 支持将通用线路代码转换为阿里云线路代码（如 `0` → `default`, `10=1` → `unicom`）
- **权重配置**: 支持通过 `DescribeDNSSLBSubDomains` 和 `UpdateDNSSLBWeight` 管理权重
- **重试机制**: 请求失败时自动重试一次（延迟50ms）

#### 请求示例
```php
// 获取域名列表
$param = [
    'Action' => 'DescribeDomains',
    'KeyWord' => 'example.com',
    'PageNumber' => 1,
    'PageSize' => 20
];
$result = $client->request($param);
```

---

### 2. 腾讯云/DNSPod

**配置文件：** `app/lib/dns/dnspod.php`  
**客户端类：** `app/lib/client/TencentCloud.php`

#### 认证信息
- **SecretId**: 腾讯云SecretId
- **SecretKey**: 腾讯云SecretKey
- **Endpoint**: `dnspod.tencentcloudapi.com`
- **Service**: `dnspod`
- **API版本**: `2021-03-23`

#### 认证方式
使用 TC3-HMAC-SHA256 签名算法，遵循腾讯云API 3.0签名规范。

#### 主要API端点

| 操作 | Action | 方法 | 说明 |
|------|--------|------|------|
| 获取域名列表 | DescribeDomainList | POST | 支持关键词搜索、分页 |
| 获取解析记录 | DescribeRecordList / DescribeRecordFilterList | POST | 根据条件选择不同接口 |
| 获取记录详情 | DescribeRecord | POST | 根据RecordId获取 |
| 添加记录 | CreateRecord | POST | 返回RecordId |
| 修改记录 | ModifyRecord | POST | 修改记录内容 |
| 修改备注 | ModifyRecordRemark | POST | 单独修改备注 |
| 删除记录 | DeleteRecord | POST | 根据RecordId删除 |
| 设置状态 | ModifyRecordStatus | POST | ENABLE/DISABLE |
| 获取日志 | DescribeDomainLogList | POST | 操作日志 |
| 获取线路 | DescribeRecordLineCategoryList | POST | 获取线路分类列表 |
| 添加域名 | CreateDomain | POST | 添加新域名 |

#### 特殊处理
- **类型转换**: 支持显性URL/隐性URL与标准类型的转换
- **线路转换**: 支持通用线路代码与DNSPod线路代码的转换
- **记录类型**: 支持 `REDIRECT_URL`（显性URL）和 `FORWARD_URL`（隐性URL）

#### 请求示例
```php
// 获取域名列表
$action = 'DescribeDomainList';
$param = [
    'Offset' => 0,
    'Limit' => 20,
    'Keyword' => 'example.com'
];
$result = $client->request($action, $param);
```

---

### 3. 华为云

**配置文件：** `app/lib/dns/huawei.php`  
**客户端类：** `app/lib/client/HuaweiCloud.php`

#### 认证信息
- **AccessKeyId**: 华为云AccessKey ID
- **SecretAccessKey**: 华为云SecretAccessKey
- **Endpoint**: `dns.myhuaweicloud.com`

#### 认证方式
使用 SDK-HMAC-SHA256 签名算法，遵循华为云API签名规范。

#### 主要API端点

| 操作 | 路径 | 方法 | 说明 |
|------|------|------|------|
| 获取域名列表 | `/v2/zones` | GET | 支持关键词搜索、分页 |
| 获取解析记录 | `/v2.1/zones/{zone_id}/recordsets` | GET | 支持多种筛选条件 |
| 获取记录详情 | `/v2.1/zones/{zone_id}/recordsets/{recordset_id}` | GET | 根据RecordId获取 |
| 添加记录 | `/v2.1/zones/{zone_id}/recordsets` | POST | 返回记录ID |
| 修改记录 | `/v2.1/zones/{zone_id}/recordsets/{recordset_id}` | PUT | 修改记录内容 |
| 删除记录 | `/v2.1/zones/{zone_id}/recordsets/{recordset_id}` | DELETE | 根据RecordId删除 |
| 设置状态 | `/v2.1/recordsets/{recordset_id}/statuses/set` | PUT | ACTIVE/DISABLE |
| 获取线路 | 静态文件 | - | 从 `huawei_line.json` 读取 |
| 添加域名 | `/v2/zones` | POST | 添加新域名 |

#### 特殊处理
- **域名ID**: 需要提供 `domainid`（zone_id）才能操作记录
- **TXT记录**: 自动添加引号包裹
- **MX记录**: 格式为 `优先级 值`
- **备注**: 通过 `description` 字段设置，不支持单独修改
- **线路数据**: 从本地JSON文件读取线路信息

#### 请求示例
```php
// 获取域名列表
$query = [
    'offset' => 0,
    'limit' => 20,
    'name' => 'example.com'
];
$result = $client->request('GET', '/v2/zones', $query);
```

---

### 4. 百度云

**配置文件：** `app/lib/dns/baidu.php`  
**客户端类：** `app/lib/client/BaiduCloud.php`

#### 认证信息
- **AccessKey**: 百度云AccessKey
- **SecretKey**: 百度云SecretKey
- **Endpoint**: `dns.baidubce.com`

#### 认证方式
使用百度云标准签名算法（类似AWS签名）。

#### 主要API端点

| 操作 | 路径 | 方法 | 说明 |
|------|------|------|------|
| 获取域名列表 | `/v1/dns/zone` | GET | 支持关键词搜索 |
| 获取解析记录 | `/v1/dns/zone/{zone}/record` | GET | 客户端分页 |
| 获取记录详情 | `/v1/dns/zone/{zone}/record` | GET | 通过ID查询 |
| 添加记录 | `/v1/dns/zone/{zone}/record` | POST | 需要clientToken |
| 修改记录 | `/v1/dns/zone/{zone}/record/{recordId}` | PUT | 需要clientToken |
| 删除记录 | `/v1/dns/zone/{zone}/record/{recordId}` | DELETE | 需要clientToken |
| 设置状态 | `/v1/dns/zone/{zone}/record/{recordId}` | PUT | enable/disable |
| 获取线路 | 静态返回 | - | 固定线路列表 |
| 添加域名 | `/v1/dns/zone` | POST | 需要clientToken |

#### 特殊处理
- **客户端分页**: 所有记录一次性获取，在客户端进行分页和筛选
- **clientToken**: 每次写操作需要提供唯一的clientToken（使用 `getSid()` 生成）
- **备注**: 通过 `description` 字段设置，不支持单独修改
- **状态**: 不支持启用/暂停功能

#### 请求示例
```php
// 添加记录
$query = ['clientToken' => getSid()];
$params = [
    'rr' => 'www',
    'type' => 'A',
    'value' => '1.1.1.1',
    'line' => 'default',
    'ttl' => 600,
    'description' => '备注'
];
$result = $client->request('POST', '/v1/dns/zone/example.com/record', $query, $params);
```

---

### 5. 西部数码

**配置文件：** `app/lib/dns/west.php`

#### 认证信息
- **用户名**: 西部数码账户名
- **API密码**: 西部数码API密码
- **Base URL**: `https://api.west.cn/api/v2`

#### 认证方式
使用时间戳+Token认证：
- `time`: 当前时间戳（毫秒）
- `token`: MD5(用户名 + API密码 + time)

#### 主要API端点

| 操作 | 路径 | act参数 | 方法 | 说明 |
|------|------|---------|------|------|
| 获取域名列表 | `/domain/` | getdomains | GET | 支持分页、关键词搜索 |
| 获取解析记录 | `/domain/` | getdnsrecord | GET | 支持多种筛选条件 |
| 添加记录 | `/domain/` | adddnsrecord | POST | 返回记录ID |
| 修改记录 | `/domain/` | moddnsrecord | POST | 修改记录内容 |
| 删除记录 | `/domain/` | deldnsrecord | POST | 根据ID删除 |
| 设置状态 | `/domain/` | pause | POST | 暂停/启用 |
| 获取线路 | 静态返回 | - | - | 固定线路列表 |

#### 特殊处理
- **响应编码**: 响应为GBK编码，需要转换为UTF-8
- **状态值**: `pause=1` 表示暂停（状态为0），`pause=0` 表示启用（状态为1）
- **备注**: 不支持备注功能
- **添加域名**: 不支持通过API添加域名

#### 请求示例
```php
// 获取域名列表
$param = [
    'act' => 'getdomains',
    'page' => 1,
    'limit' => 20,
    'domain' => 'example.com',
    'username' => $username,
    'time' => getMillisecond(),
    'token' => md5($username . $api_password . getMillisecond())
];
$result = http_request($baseUrl . '/domain/', http_build_query($param));
```

---

### 6. 火山引擎

**配置文件：** `app/lib/dns/huoshan.php`  
**客户端类：** `app/lib/client/Volcengine.php`

#### 认证信息
- **AccessKeyId**: 火山引擎AccessKey ID
- **SecretAccessKey**: 火山引擎SecretAccessKey
- **Endpoint**: `open.volcengineapi.com`
- **Service**: `DNS`
- **API版本**: `2018-08-01`
- **Region**: `cn-north-1`

#### 认证方式
使用火山引擎标准签名算法。

#### 主要API端点

| 操作 | Action | 方法 | 说明 |
|------|--------|------|------|
| 获取域名列表 | ListZones | GET | 支持分页、关键词搜索 |
| 获取解析记录 | ListRecords | GET | 支持多种筛选条件 |
| 获取记录详情 | QueryRecord | GET | 根据RecordID获取 |
| 添加记录 | CreateRecord | POST | 返回RecordID |
| 修改记录 | UpdateRecord | POST | 修改记录内容 |
| 删除记录 | DeleteRecord | POST | 根据RecordID删除 |
| 设置状态 | UpdateRecordStatus | POST | Enable/Disable |
| 获取线路 | ListLines / ListCustomLines | GET | 根据套餐等级返回可用线路 |
| 获取域名信息 | QueryZone | GET | 获取域名详情和套餐信息 |
| 添加域名 | CreateZone | POST | 添加新域名 |

#### 特殊处理
- **域名ID**: 需要提供 `domainid`（ZID）才能操作记录
- **套餐等级**: 根据域名套餐等级（免费版/专业版/企业版/旗舰版/尊享版）限制最低TTL和可用线路
- **最低TTL**: 根据套餐等级返回（免费版600秒，专业版300秒，企业版60秒，旗舰版/尊享版1秒）
- **自定义线路**: 支持获取自定义线路列表
- **备注**: 通过 `Remark` 字段设置，不支持单独修改

#### 请求示例
```php
// 获取域名列表
$query = [
    'PageNumber' => 1,
    'PageSize' => 20,
    'Key' => 'example.com'
];
$result = $client->request('GET', 'ListZones', $query);
```

---

### 7. 京东云

**配置文件：** `app/lib/dns/jdcloud.php`  
**客户端类：** `app/lib/client/Jdcloud.php`

#### 认证信息
- **AccessKeyId**: 京东云AccessKey ID
- **AccessKeySecret**: 京东云AccessKey Secret
- **Endpoint**: `domainservice.jdcloud-api.com`
- **Service**: `domainservice`
- **API版本**: `v2`
- **Region**: `cn-north-1`

#### 认证方式
使用京东云标准签名算法。

#### 主要API端点

| 操作 | 路径 | 方法 | 说明 |
|------|------|------|------|
| 获取域名列表 | `/v2/regions/{region}/domain` | GET | 支持分页、关键词搜索 |
| 获取解析记录 | `/v2/regions/{region}/domain/{domainId}/ResourceRecord` | GET | 支持分页、搜索 |
| 添加记录 | `/v2/regions/{region}/domain/{domainId}/ResourceRecord` | POST | 返回记录ID |
| 修改记录 | `/v2/regions/{region}/domain/{domainId}/ResourceRecord/{recordId}` | PUT | 修改记录内容 |
| 删除记录 | `/v2/regions/{region}/domain/{domainId}/ResourceRecord/{recordId}` | DELETE | 根据ID删除 |
| 设置状态 | `/v2/regions/{region}/domain/{domainId}/ResourceRecord/{recordId}/status` | PUT | enable/disable |
| 获取线路 | `/v2/regions/{region}/domain/{domainId}/viewTree` | GET | 根据packId获取线路树 |
| 添加域名 | `/v2/regions/{region}/domain` | POST | 添加新域名 |

#### 特殊处理
- **域名ID**: 需要提供 `domainid` 才能操作记录
- **线路值**: 线路使用 `viewValue` 数组，取最后一个值作为线路标识
- **SRV记录**: 特殊处理SRV记录格式（`优先级 权重 端口 目标`）
- **URL转发**: 支持显性URL（EXPLICIT_URL）和隐性URL（IMPLICIT_URL）
- **备注**: 不支持备注功能
- **分页限制**: 每页最多99条记录

#### 请求示例
```php
// 获取域名列表
$query = [
    'pageNumber' => 1,
    'pageSize' => 20,
    'domainName' => 'example.com'
];
$path = '/v2/regions/cn-north-1/domain';
$result = $client->request('GET', $path, $query);
```

---

### 8. DNSLA

**配置文件：** `app/lib/dns/dnsla.php`

#### 认证信息
- **APIID**: DNSLA API ID
- **API密钥**: DNSLA API密钥
- **Base URL**: `https://api.dns.la`

#### 认证方式
使用 HTTP Basic 认证：
- Header: `Authorization: Basic {base64(APIID:API密钥)}`

#### 主要API端点

| 操作 | 路径 | 方法 | 说明 |
|------|------|------|------|
| 获取域名列表 | `/api/domainList` | GET | 支持分页 |
| 获取解析记录 | `/api/recordList` | GET | 支持多种筛选条件 |
| 添加记录 | `/api/record` | POST | 返回记录ID |
| 修改记录 | `/api/record` | PUT | 修改记录内容 |
| 删除记录 | `/api/record` | DELETE | 根据ID删除 |
| 设置状态 | `/api/recordDisable` | PUT | 启用/禁用 |
| 获取线路 | `/api/availableLine` | GET | 获取可用线路列表 |
| 获取域名信息 | `/api/domain` | GET | 获取域名详情 |
| 获取最低TTL | `/api/dnsMeasures` | GET | 获取域名最低TTL |
| 添加域名 | `/api/domain` | POST | 添加新域名 |

#### 特殊处理
- **域名ID**: 需要提供 `domainid` 才能操作记录
- **记录类型**: 使用数字ID（1=A, 2=NS, 5=CNAME, 15=MX, 16=TXT, 28=AAAA, 33=SRV, 257=CAA, 256=URL转发）
- **URL转发**: 通过 `dominant` 参数区分显性URL（true）和隐性URL（false）
- **备注**: 不支持备注功能
- **响应格式**: 统一返回 `{code: 200, data: {...}, msg: ''}` 格式

#### 请求示例
```php
// 获取域名列表
$param = [
    'pageIndex' => 1,
    'pageSize' => 20
];
$token = base64_encode($apiid . ':' . $apisecret);
$header = ['Authorization: Basic ' . $token, 'Content-Type: application/json'];
$result = curl_exec($ch); // 使用curl发送请求
```

---

### 9. Cloudflare

**配置文件：** `app/lib/dns/cloudflare.php`

#### 认证信息
- **邮箱**: Cloudflare账户邮箱
- **API密钥**: Cloudflare API Key 或 API Token
- **Base URL**: `https://api.cloudflare.com/client/v4`

#### 认证方式
支持两种认证方式：
1. **API Key**: Header `X-Auth-Email` + `X-Auth-Key`
2. **API Token**: Header `Authorization: Bearer {token}`

#### 主要API端点

| 操作 | 路径 | 方法 | 说明 |
|------|------|------|------|
| 获取域名列表 | `/zones` | GET | 支持分页、关键词搜索 |
| 获取解析记录 | `/zones/{zone_id}/dns_records` | GET | 支持多种筛选条件 |
| 获取记录详情 | `/zones/{zone_id}/dns_records/{record_id}` | GET | 根据ID获取 |
| 添加记录 | `/zones/{zone_id}/dns_records` | POST | 返回记录ID |
| 修改记录 | `/zones/{zone_id}/dns_records/{record_id}` | PATCH | 修改记录内容 |
| 删除记录 | `/zones/{zone_id}/dns_records/{record_id}` | DELETE | 根据ID删除 |
| 设置状态 | 通过修改记录名 | PATCH | 添加 `_pause` 后缀表示暂停 |
| 获取线路 | 静态返回 | - | 仅DNS/已代理 |
| 添加域名 | `/zones` | POST | 添加新域名 |

#### 特殊处理
- **域名ID**: 需要提供 `domainid`（zone_id）才能操作记录
- **代理状态**: 通过 `proxied` 字段控制（true=已代理，false=仅DNS）
- **暂停记录**: 通过修改记录名添加 `_pause` 后缀实现暂停功能
- **特殊记录类型**: 
  - CAA/SRV记录使用 `data` 字段而非 `content` 字段
  - SRV格式：`{priority, weight, port, target}`
  - CAA格式：`{flags, tag, value}`
- **备注**: 通过 `comment` 字段设置，不支持单独修改
- **响应格式**: 统一返回 `{success: true, result: {...}, errors: []}` 格式

#### 请求示例
```php
// 获取域名列表
$url = 'https://api.cloudflare.com/client/v4/zones?page=1&per_page=20';
$headers = [
    'X-Auth-Email: ' . $email,
    'X-Auth-Key: ' . $apiKey
];
$result = curl_exec($ch);
```

---

### 10. NameSilo

**配置文件：** `app/lib/dns/namesilo.php`

#### 认证信息
- **API Key**: NameSilo API Key
- **Base URL**: `https://www.namesilo.com/api/`
- **API版本**: `1`

#### 认证方式
通过URL参数传递：
- `version`: API版本
- `type`: 返回格式（json）
- `key`: API Key

#### 主要API端点

| 操作 | Operation | 方法 | 说明 |
|------|-----------|------|------|
| 获取域名列表 | listDomains | GET | 支持分页 |
| 获取解析记录 | dnsListRecords | GET | 获取所有记录，客户端筛选 |
| 添加记录 | dnsAddRecord | GET | 返回record_id |
| 修改记录 | dnsUpdateRecord | GET | 修改记录内容 |
| 删除记录 | dnsDeleteRecord | GET | 根据record_id删除 |
| 获取线路 | 静态返回 | - | 仅默认线路 |

#### 特殊处理
- **客户端分页**: 所有记录一次性获取，在客户端进行分页和筛选
- **记录ID**: 使用 `record_id` 作为唯一标识
- **@符号**: 空字符串表示根域名（@）
- **状态**: 不支持启用/暂停功能
- **备注**: 不支持备注功能
- **响应格式**: 统一返回 `{reply: {code: 300, ...}}` 格式，code=300表示成功

#### 请求示例
```php
// 获取域名列表
$params = [
    'version' => '1',
    'type' => 'json',
    'key' => $apikey,
    'page' => 1,
    'pageSize' => 20
];
$url = 'https://www.namesilo.com/api/listDomains?' . http_build_query($params);
$result = http_request($url);
```

---

### 11. PowerDNS

**配置文件：** `app/lib/dns/powerdns.php`

#### 认证信息
- **IP地址**: PowerDNS服务器IP（作为ak）
- **端口**: PowerDNS服务器端口（作为sk）
- **API KEY**: PowerDNS API密钥（作为ext）
- **Base URL**: `http://{ip}:{port}/api/v1`
- **Server ID**: `localhost`

#### 认证方式
通过Header传递：
- `X-API-Key: {api_key}`

#### 主要API端点

| 操作 | 路径 | 方法 | 说明 |
|------|------|------|------|
| 获取域名列表 | `/servers/{server_id}/zones` | GET | 获取所有zone |
| 获取解析记录 | `/servers/{server_id}/zones/{zone_id}` | GET | 获取zone的所有rrsets |
| 添加记录 | `/servers/{server_id}/zones/{zone_id}` | PATCH | 使用REPLACE changetype |
| 修改记录 | `/servers/{server_id}/zones/{zone_id}` | PATCH | 使用REPLACE changetype |
| 删除记录 | `/servers/{server_id}/zones/{zone_id}` | PATCH | 使用DELETE changetype |
| 设置状态 | `/servers/{server_id}/zones/{zone_id}` | PATCH | 通过disabled字段 |
| 获取线路 | 静态返回 | - | 仅默认线路 |
| 添加域名 | `/servers/{server_id}/zones` | POST | 添加新zone |

#### 特殊处理
- **域名ID**: 需要提供 `domainid`（zone名称，带点结尾）
- **RRSet概念**: PowerDNS使用RRSet（资源记录集）概念，一个RRSet包含多个records
- **记录ID**: 使用 `{rrset_id}_{record_id}` 格式
- **缓存机制**: 使用缓存存储zone的rrsets数据，避免频繁请求
- **TXT记录**: 自动添加引号包裹
- **CNAME/MX记录**: 自动添加点结尾
- **备注**: 通过 `comments` 数组设置，不支持单独修改
- **changetype**: 使用 `REPLACE` 添加/修改，使用 `DELETE` 删除

#### 请求示例
```php
// 获取域名列表
$url = 'http://192.168.1.1:8081/api/v1/servers/localhost/zones';
$headers = ['X-API-Key: ' . $apikey];
$result = http_request($url, null, null, null, $headers, false, 'GET');
```

---

### 12. Spaceship

**配置文件：** `app/lib/dns/spaceship.php`

#### 认证信息
- **AccessKey**: Spaceship API Key
- **SecretKey**: Spaceship API Secret
- **Base URL**: `https://spaceship.dev/api/v1`

#### 认证方式
通过Header传递：
- `X-API-Key: {access_key}`
- `X-API-Secret: {secret_key}`

#### 主要API端点

| 操作 | 路径 | 方法 | 说明 |
|------|------|------|------|
| 获取域名列表 | `/domains` | GET | 支持分页（take/skip） |
| 获取解析记录 | `/dns/records/{domain}` | GET | 支持分页、host筛选 |
| 添加记录 | `/dns/records/{domain}` | PUT | 使用force模式批量操作 |
| 修改记录 | `/dns/records/{domain}` | PUT | 使用force模式批量操作 |
| 删除记录 | `/dns/records/{domain}` | DELETE | 根据类型和内容删除 |
| 获取线路 | 静态返回 | - | 仅默认线路 |

#### 特殊处理
- **记录ID**: 使用 `{type}|{name}|{address}|{mx}` 格式作为唯一标识
- **批量操作**: 添加/修改操作使用 `items` 数组，支持批量
- **force模式**: 写操作需要设置 `force: true`
- **多种记录类型**: 支持MX、CNAME、TXT、PTR、NS、HTTPS、CAA、TLSA、SVRB、ALIAS等
- **状态**: 不支持启用/暂停功能
- **备注**: 不支持备注功能
- **添加域名**: 不支持通过API添加域名

#### 请求示例
```php
// 添加记录
$param = [
    'force' => true,
    'items' => [
        [
            'type' => 'A',
            'name' => 'www',
            'address' => '1.1.1.1',
            'ttl' => 600
        ]
    ]
];
$url = 'https://spaceship.dev/api/v1/dns/records/example.com';
$headers = [
    'X-API-Key: ' . $apiKey,
    'X-API-Secret: ' . $apiSecret,
    'Content-Type: application/json'
];
$result = curl_exec($ch);
```

---

## 通用接口方法说明

### 1. getError()
获取最后一次操作的错误信息。

**返回值**: `string|null` - 错误信息，无错误时返回null

### 2. check()
检查认证信息是否有效。

**返回值**: `bool` - true表示有效，false表示无效

### 3. getDomainList($KeyWord, $PageNumber, $PageSize)
获取域名列表。

**参数**:
- `$KeyWord` (string|null): 关键词搜索
- `$PageNumber` (int): 页码，从1开始
- `$PageSize` (int): 每页数量

**返回值**: 
```php
[
    'total' => 100,  // 总记录数
    'list' => [
        [
            'DomainId' => '123456',
            'Domain' => 'example.com',
            'RecordCount' => 10
        ],
        // ...
    ]
]
```

### 4. getDomainRecords(...)
获取解析记录列表。

**参数**:
- `$PageNumber` (int): 页码
- `$PageSize` (int): 每页数量
- `$KeyWord` (string|null): 关键词
- `$SubDomain` (string|null): 子域名
- `$Value` (string|null): 记录值
- `$Type` (string|null): 记录类型
- `$Line` (string|null): 线路
- `$Status` (string|null): 状态（'1'=启用，'0'=暂停）

**返回值**:
```php
[
    'total' => 50,
    'list' => [
        [
            'RecordId' => '123456',
            'Domain' => 'example.com',
            'Name' => 'www',
            'Type' => 'A',
            'Value' => '1.1.1.1',
            'Line' => 'default',
            'TTL' => 600,
            'MX' => null,
            'Status' => '1',
            'Weight' => null,
            'Remark' => '备注',
            'UpdateTime' => '2024-01-01 12:00:00'
        ],
        // ...
    ]
]
```

### 5. addDomainRecord($Name, $Type, $Value, $Line, $TTL, $MX, $Weight, $Remark)
添加解析记录。

**参数**:
- `$Name` (string): 记录名（子域名，@表示根域名）
- `$Type` (string): 记录类型（A、AAAA、CNAME、MX、TXT等）
- `$Value` (string): 记录值
- `$Line` (string): 线路（默认'default'）
- `$TTL` (int): TTL值（默认600）
- `$MX` (int|null): MX优先级（仅MX记录需要）
- `$Weight` (int|null): 权重（仅支持权重的提供商）
- `$Remark` (string|null): 备注

**返回值**: `string|false` - 成功返回RecordId，失败返回false

### 6. updateDomainRecord(...)
修改解析记录，参数同 `addDomainRecord`，但第一个参数为 `$RecordId`。

**返回值**: `bool` - 成功返回true，失败返回false

### 7. deleteDomainRecord($RecordId)
删除解析记录。

**参数**:
- `$RecordId` (string): 记录ID

**返回值**: `bool` - 成功返回true，失败返回false

---

## 使用示例

### 基本使用

```php
use app\lib\DnsHelper;

// 通过账户ID获取DNS实例
$dns = DnsHelper::getModel($accountId, $domain, $domainId);
if (!$dns) {
    die('获取DNS实例失败');
}

// 检查认证
if (!$dns->check()) {
    die('认证失败: ' . $dns->getError());
}

// 获取域名列表
$domainList = $dns->getDomainList('example', 1, 20);
if ($domainList === false) {
    die('获取域名列表失败: ' . $dns->getError());
}

// 获取解析记录列表
$records = $dns->getDomainRecords(1, 20, null, 'www', null, 'A');
if ($records === false) {
    die('获取记录列表失败: ' . $dns->getError());
}

// 添加解析记录
$recordId = $dns->addDomainRecord('www', 'A', '1.1.1.1', 'default', 600);
if ($recordId === false) {
    die('添加记录失败: ' . $dns->getError());
}

// 修改解析记录
$success = $dns->updateDomainRecord($recordId, 'www', 'A', '2.2.2.2', 'default', 600);
if (!$success) {
    die('修改记录失败: ' . $dns->getError());
}

// 删除解析记录
$success = $dns->deleteDomainRecord($recordId);
if (!$success) {
    die('删除记录失败: ' . $dns->getError());
}
```

### 直接使用配置

```php
use app\lib\DnsHelper;

$config = [
    'type' => 'aliyun',
    'ak' => 'your_access_key_id',
    'sk' => 'your_access_key_secret',
    'domain' => 'example.com',
    'domainid' => '123456',
    'name' => 'example.com',
    'thirdid' => '123456'
];

$dns = DnsHelper::getModel2($config);
```

### 错误处理

```php
$dns = DnsHelper::getModel($accountId, $domain, $domainId);

// 所有操作都应该检查返回值
$result = $dns->addDomainRecord('www', 'A', '1.1.1.1');
if ($result === false) {
    // 获取错误信息
    $error = $dns->getError();
    echo "操作失败: $error";
} else {
    echo "记录ID: $result";
}
```

---

## 注意事项

1. **域名ID**: 部分提供商（华为云、火山引擎、京东云、DNSLA、Cloudflare、PowerDNS）需要提供 `domainid` 才能操作记录，需要先通过 `getDomainList` 获取。

2. **线路代码**: 不同提供商的线路代码格式不同，需要根据提供商进行转换。参考 `DnsHelper::$line_name` 中的映射关系。

3. **分页方式**: 
   - **服务端分页**: 大多数提供商支持，通过API参数控制
   - **客户端分页**: 百度云、NameSilo、PowerDNS需要一次性获取所有记录后在客户端分页

4. **记录类型**: 部分提供商支持特殊记录类型（如URL转发），需要特殊处理。

5. **错误处理**: 所有操作都应该检查返回值，失败时通过 `getError()` 获取错误信息。

6. **代理支持**: 所有提供商都支持通过 `proxy` 配置项启用代理。

7. **重试机制**: 阿里云实现了自动重试机制（失败后延迟50ms重试一次），其他提供商可根据需要自行实现。

---

## 总结

本项目实现了12个主流DNS提供商的统一接口，通过 `DnsInterface` 接口规范，实现了不同提供商之间的无缝切换。每个提供商都有其特定的认证方式和API端点，但通过统一的接口封装，对外提供了一致的调用方式。

在复用这些代码时，需要注意：
- 保持 `DnsInterface` 接口规范
- 实现统一的错误处理机制
- 根据提供商特性进行特殊处理（如线路转换、类型转换等）
- 注意分页方式的差异
- 合理处理域名ID的获取和使用

---

**文档生成时间**: 2024年  
**项目路径**: `app/lib/dns/`  
**接口定义**: `app/lib/DnsInterface.php`  
**辅助类**: `app/lib/DnsHelper.php`

