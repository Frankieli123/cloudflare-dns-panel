import api from './api';
import { ApiResponse, LoginResponse, User } from '@/types';

/**
 * 用户注册
 */
export const register = async (params: {
  username: string;
  email: string;
  password: string;
  cfApiToken: string;
  cfAccountId?: string;
}): Promise<ApiResponse<{ user: User }>> => {
  return api.post('/auth/register', params);
};

/**
 * 用户登录
 */
export const login = async (params: {
  username: string;
  password: string;
}): Promise<LoginResponse> => {
  return api.post('/auth/login', params);
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (): Promise<ApiResponse<{ user: User }>> => {
  return api.get('/auth/me');
};

/**
 * 修改密码
 */
export const updatePassword = async (params: {
  oldPassword: string;
  newPassword: string;
}): Promise<ApiResponse> => {
  return api.put('/auth/password', params);
};

/**
 * 更新 Cloudflare API Token
 */
export const updateCfToken = async (cfApiToken: string): Promise<ApiResponse> => {
  return api.put('/auth/cf-token', { cfApiToken });
};

/**
 * 保存登录信息到本地存储
 */
export const saveAuthData = (token: string, user: User) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * 清除登录信息
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * 获取本地存储的用户信息
 */
export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * 检查是否已登录
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};
