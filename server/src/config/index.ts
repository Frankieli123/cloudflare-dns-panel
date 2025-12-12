import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  // 环境配置
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // 数据库配置
  databaseUrl: process.env.DATABASE_URL || 'file:./database.db',

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // 加密配置
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-32-character-key-here!',

  // CORS 配置
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // 日志配置
  logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '90', 10),

  // 缓存配置
  cache: {
    domainsTTL: 300, // 5 分钟
    recordsTTL: 120, // 2 分钟
    userTTL: 600, // 10 分钟
  },

  // 速率限制配置
  rateLimit: {
    login: {
      windowMs: 60 * 1000, // 1 分钟
      max: 5, // 5 次
    },
    dns: {
      windowMs: 60 * 1000, // 1 分钟
      max: 30, // 30 次
    },
    general: {
      windowMs: 60 * 1000, // 1 分钟
      max: 100, // 100 次
    },
  },
};

// 验证必需的环境变量
export function validateConfig() {
  const required = ['JWT_SECRET', 'ENCRYPTION_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0 && config.nodeEnv === 'production') {
    throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
  }

  if (config.encryptionKey.length !== 32) {
    console.warn('警告: ENCRYPTION_KEY 应该是 32 字符长度');
  }
}
