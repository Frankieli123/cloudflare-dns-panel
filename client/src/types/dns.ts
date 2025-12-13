export type ProviderType = 'cloudflare' | 'aliyun' | 'dnspod';

export interface DnsCredential {
  id: number;
  name: string;
  provider: ProviderType;
  providerName?: string;
  accountId?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderConfig {
  type: ProviderType;
  name: string;
  icon?: string;
  authFields: AuthField[];
}

export interface AuthField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder?: string;
  required: boolean;
  helpText?: string;
}

export type DnsCredentialSecrets = Record<string, string>;
