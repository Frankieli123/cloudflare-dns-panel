# Cloudflare DNS 管理系统

一个基于 React + Node.js 的 Cloudflare DNS 管理 Web 应用，支持用户登录认证、域名管理、DNS 记录快速操作、自定义主机名管理和完整的操作日志记录。

## 技术栈

### 前端
- React 18 + TypeScript
- Vite
- Material-UI (MUI)
- React Query
- Axios
- React Router v6

### 后端
- Node.js 18+
- Express + TypeScript
- SQLite + Prisma ORM
- JWT 认证
- Cloudflare SDK

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd CF
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，填入必要的配置
```

3. **安装后端依赖**
```bash
cd server
npm install
```

4. **初始化数据库**
```bash
npx prisma migrate dev
```

5. **启动后端服务**
```bash
npm run dev
```

6. **安装前端依赖（新终端）**
```bash
cd client
npm install
```

7. **启动前端服务**
```bash
npm run dev
```

8. **访问应用**
- 前端：http://localhost:5173
- 后端 API：http://localhost:3000

## 主要功能

- ✅ 用户登录认证（JWT）
- ✅ 域名列表查看
- ✅ DNS 记录管理（增删改查）
- ✅ 快速添加 DNS 记录
- ✅ 自定义主机名管理
- ✅ 完整操作日志记录
- ✅ 批量操作支持

## 项目结构

```
CF/
├── client/          # React 前端
├── server/          # Node.js 后端
├── .env.example     # 环境变量示例
├── .gitignore
├── README.md
└── 项目规划.md      # 详细项目规划
```

## 开发文档

详细的项目规划和技术文档请查看 [项目规划.md](./项目规划.md)

## 部署

请参考 [项目规划.md](./项目规划.md) 中的部署方案章节。

## License

MIT
