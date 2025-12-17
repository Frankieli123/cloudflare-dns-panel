# DNS Panel（dns-panel）

一个现代化、基于 Docker 部署的多 DNS 服务商统一管理面板。支持多用户、多账户（凭证）隔离，统一管理域名与 DNS 解析记录，并提供操作日志审计。

## ✨ 主要特性

- 🐳 **Docker 部署**：单镜像多阶段构建，前后端一体化部署
- 🔐 **安全认证**：多用户系统，JWT 登录
- 🔒 **敏感信息加密存储**：DNS 凭证（secrets）加密存储（需要 `ENCRYPTION_KEY`）
- 🧩 **多服务商支持**：
  - Cloudflare
  - 阿里云（Aliyun）
  - 腾讯云（DNSPod）
  - 华为云（Huawei）
  - 百度云（Baidu）
  - 西部数码（West）
  - 火山引擎（Huoshan）
  - 京东云（JDCloud）
  - DNSLA
  - NameSilo
  - PowerDNS
  - Spaceship
- 🌐 **域名管理**：查看/搜索账户下的域名列表
- 📝 **DNS 记录管理**：新增/修改/删除记录；部分服务商支持更多能力（权重/线路/启停/备注等）
- 🚀 **Cloudflare 自定义主机名（Custom Hostname）**：主机名管理、证书状态查看、回退源（Fallback Origin）配置
- 📊 **操作日志**：记录用户操作，便于审计与追踪
- 💾 **数据持久化**：SQLite 数据库（挂载 Volume 即可备份迁移）

## 🚀 快速开始

### 方式一：Docker Compose（使用仓库自带 `docker-compose.yml`）

说明：仓库自带的 `docker-compose.yml` 当前服务名/容器名仍为历史命名 `cf-dns-manager`（不影响使用）。

#### 1. 配置环境变量

创建 `.env` 文件（或直接修改 `docker-compose.yml`）：

```bash
# 🔴 必须设置（生产环境）
JWT_SECRET=your-random-jwt-secret-min-32-chars-here
ENCRYPTION_KEY=your-32-character-encryption-key!!
DATABASE_URL=file:/app/data/database.db

```

**生成安全密钥：**
```bash
# 生成 JWT_SECRET（建议 32+ 字符）
openssl rand -base64 48

# 生成 ENCRYPTION_KEY（必须 32 字符）
openssl rand -hex 16
```

#### 2. 启动服务

```bash
docker-compose up -d --build
```

#### 3. 访问应用

- **Web 界面**：[http://localhost:3000](http://localhost:3000)
- **健康检查**：[http://localhost:3000/health](http://localhost:3000/health)

#### 4. 初始配置

1. 访问 Web 界面，注册一个新账户
2. 登录后进入 **“设置”** 页面
3. 在 **DNS 账户管理** 中新增/编辑你的 DNS 服务商凭证（每个凭证可自定义“账户别名”）
4. 回到仪表盘选择服务商/账户后开始管理域名与解析记录

### 方式二：使用已发布镜像（Docker Hub）

镜像名：`a3180623/dns-panel`

```bash
# 运行容器
docker run -d \
  --name dns-panel \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-here \
  -e ENCRYPTION_KEY=your-32-char-encryption-key!! \
  -e DATABASE_URL=file:/app/data/database.db \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  a3180623/dns-panel:latest
```

说明：

- 生产环境下 `JWT_SECRET` 与 `ENCRYPTION_KEY` 为必填项；否则服务启动会报错。
- `DATABASE_URL` 建议固定为 `file:/app/data/database.db` 并挂载 `/app/data` 做持久化。

## 🛠️ 手动部署（开发环境）

如果您想进行二次开发或不使用 Docker，可以手动启动。

### 前置要求
- Node.js 18+
- npm 或 yarn

### 步骤

1. **克隆项目**:
   ```bash
   git clone <repository-url>
   cd <project-dir>
   ```

2. **后端配置与启动**:
   ```bash
   cd server

   # 安装依赖
   npm install

   # 配置环境变量（后端会读取 server/.env）
   cp ../.env.example .env
   # 编辑 server/.env 文件，设置 JWT_SECRET 和 ENCRYPTION_KEY

   # 初始化数据库
   npx prisma generate
   npx prisma migrate dev

   # 启动开发服务器
   npm run dev
   ```

3. **前端配置与启动**（新终端）:
   ```bash
   cd client

   # 安装依赖
   npm install

   # 启动开发服务器
   npm run dev
   ```

4. **访问应用**:
   - 前端：http://localhost:5173
   - 后端 API：http://localhost:3000

## ⚙️ 环境变量配置

本项目通过环境变量配置后端服务。在 Docker 环境中，可以通过 `docker-compose.yml` 或 `.env` 文件设置。

### 完整环境变量列表

| 变量名 | 描述 | 默认值 | 必须设置 | 说明 |
| :--- | :--- | :--- | :---: | :--- |
| `JWT_SECRET` | JWT 签名密钥 | `default-secret-key` | 🔴 **是** | 用于签名用户登录 Token，生产环境必须修改 |
| `ENCRYPTION_KEY` | 数据加密密钥 | `default-32-character-key-here!` | 🔴 **是** | 用于加密 DNS 凭证 secrets，必须 32 字符 |
| `DATABASE_URL` | 数据库路径 | `file:./database.db` | 🔴 **是** | SQLite 数据库文件路径，生产环境必须显式设置并挂载到 volume（Docker 推荐：`file:/app/data/database.db`） |
| `CORS_ORIGIN` | CORS 允许的源 | `http://localhost:5173` | 🟡 建议 | 生产环境需设置为实际域名 |
| `NODE_ENV` | 运行环境 | `development` | ❌ 否 | `production` 或 `development` |
| `PORT` | 服务器端口 | `3000` | ❌ 否 | 后端监听端口 |
| `JWT_EXPIRES_IN` | Token 过期时间 | `7d` | ❌ 否 | 支持格式：`7d`, `24h`, `60m` |
| `LOG_RETENTION_DAYS` | 日志保留天数 | `90` | ❌ 否 | 操作日志保留时长 |

### 安全性说明

⚠️ **重要**：
- `JWT_SECRET` 和 `ENCRYPTION_KEY` 在生产环境中**必须**设置为强随机值
- 使用默认值会导致严重的安全风险
- `ENCRYPTION_KEY` 一旦设置后不要更改，否则已加密的数据将无法解密

> **注意**：各 DNS 服务商的凭证（如 Cloudflare Token、阿里云 AK/SK、DNSPod SecretId/SecretKey 等）**不需要**通过环境变量配置；由用户在 Web 界面的“设置”页面中自行配置，后端会加密存储。

## 📦 项目结构

```
project-root/
├── docker-compose.yml          # Docker Compose 配置文件
├── Dockerfile                  # 多阶段构建 Dockerfile（单镜像方案）
├── .env.example                # 环境变量示例文件
├── README.md                   # 项目文档
│
├── client/                     # React + TypeScript 前端
│   ├── src/
│   │   ├── components/         # React 组件
│   │   ├── pages/              # 页面组件
│   │   ├── services/           # API 服务
│   │   └── types/              # TypeScript 类型定义
│   ├── package.json
│   └── vite.config.ts          # Vite 配置
│
└── server/                     # Node.js + Express 后端
    ├── src/
    │   ├── config/             # 配置文件
    │   ├── middleware/         # Express 中间件
    │   ├── routes/             # API 路由
    │   ├── services/           # 业务逻辑
    │   │   ├── auth.ts         # 认证服务
    │   │   ├── cloudflare.ts   # Cloudflare API 封装
    │   │   └── logger.ts       # 日志服务
    │   ├── utils/              # 工具函数
    │   │   └── encryption.ts   # AES-256 加密工具
    │   ├── types/              # TypeScript 类型定义
    │   └── index.ts            # 入口文件
    ├── prisma/
    │   └── schema.prisma       # 数据库模型（SQLite）
    ├── package.json
    └── tsconfig.json
```

## 🛡️ 安全特性

### 多层安全保护

1. **JWT 认证**
   - 用户登录后颁发 JWT Token
   - Token 包含用户 ID、用户名、邮箱等信息
   - 可配置过期时间（默认 7 天）

2. **DNS 凭证加密存储**
   - 使用加密算法存储用户的 DNS 凭证 secrets（不同服务商字段不同）
   - 加密密钥通过环境变量 `ENCRYPTION_KEY` 配置
   - 数据库中仅存储加密后的 secrets

3. **密码安全**
   - 使用 bcrypt 加密用户密码（10 轮 salt）
   - 强制密码复杂度要求：
     - 最少 8 位
     - 必须包含大小写字母和数字

4. **速率限制**
   - 登录接口：1 分钟内最多 5 次
   - DNS 操作：1 分钟内最多 30 次
   - 一般接口：1 分钟内最多 100 次

5. **操作日志**
   - 记录所有 DNS 操作（创建、更新、删除）
   - 记录操作者 IP 地址
   - 支持按时间、用户、操作类型筛选

### 关于 DNS 凭证（账户）

本应用设计为**多用户 SaaS 模式**：

1. 系统管理员部署面板
2. 用户自行注册账户
3. 用户在“设置”页面新增自己的 DNS 服务商凭证（可自定义“账户别名”）
4. 后端将凭证加密存储在数据库中
5. 调用对应服务商 API 时按需解密使用

以 Cloudflare 为例，建议的 Token 权限：
- `Zone:Read`
- `Zone:Edit`
- `DNS:Edit`
- `SSL and Certificates:Edit`（如需自定义主机名/证书相关能力）

## 🔧 常见问题

### 1. 容器启动后无法访问？

检查端口映射和防火墙设置：
```bash
# 查看容器状态
docker ps

# 查看容器日志
docker logs <container-name>

# 检查健康状态
curl http://localhost:3000/health
```

### 2. 数据库文件在哪里？

默认位置：`./data/database.db`（宿主机）

查看数据库内容：
```bash
sqlite3 ./data/database.db
.tables
.schema users
```

### 3. 如何备份数据？

```bash
# 备份数据库
cp ./data/database.db ./data/database.db.backup

# 或使用 SQLite 导出
sqlite3 ./data/database.db .dump > backup.sql
```

### 4. 如何更新到最新版本？

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 5. 忘记了 ENCRYPTION_KEY 怎么办？

⚠️ **警告**：如果更改 `ENCRYPTION_KEY`，所有已加密的 Cloudflare API Token 将无法解密！

解决方案：
- 保持原有的 `ENCRYPTION_KEY` 不变
- 或者让所有用户重新设置他们的 Cloudflare API Token

## 📝 开发指南

### 技术栈

**前端**：
- React 18
- TypeScript
- Vite
- Material UI (MUI)
- TanStack React Query
- React Router
- Axios

**后端**：
- Node.js 18
- Express
- TypeScript
- Prisma ORM
- SQLite
- JWT
- bcrypt

### 本地开发

1. 安装依赖并启动后端：
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. 安装依赖并启动前端：
   ```bash
   cd client
   npm install
   npm run dev
   ```

### 数据库迁移

```bash
cd server

# 创建新的迁移
npx prisma migrate dev --name your_migration_name

# 应用迁移
npx prisma migrate deploy

# 重置数据库（开发环境）
npx prisma migrate reset
```

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

如有问题或建议，QQ：64445547。
