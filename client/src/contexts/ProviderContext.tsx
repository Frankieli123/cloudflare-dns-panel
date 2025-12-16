import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DnsCredential, ProviderConfig, ProviderType, ProviderCapabilities } from '@/types/dns';
import { getDnsCredentials, getProviders } from '@/services/dnsCredentials';

interface ProviderContextType {
  providers: ProviderConfig[];
  credentials: DnsCredential[];
  selectedProvider: ProviderType | null;
  selectedCredentialId: number | 'all' | null;
  isLoading: boolean;
  error: string | null;
  selectProvider: (provider: ProviderType | null) => void;
  selectCredential: (id: number | 'all') => void;
  refreshData: () => Promise<void>;
  getCredentialsByProvider: (provider: ProviderType) => DnsCredential[];
  getCredentialCountByProvider: (provider: ProviderType) => number;
  getProviderCapabilities: (provider?: ProviderType | null) => ProviderCapabilities | null;
  currentCapabilities: ProviderCapabilities | null;
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

const STORAGE_KEY_PROVIDER = 'dns_selected_provider';
const STORAGE_KEY_CREDENTIAL = 'dns_selected_credential';

export function ProviderProvider({ children }: { children: ReactNode }) {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [credentials, setCredentials] = useState<DnsCredential[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [selectedCredentialId, setSelectedCredentialId] = useState<number | 'all' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [provsRes, credsRes] = await Promise.all([
        getProviders(),
        getDnsCredentials(),
      ]);

      const providerList = provsRes.data?.providers || [];
      const credentialList = credsRes.data?.credentials || [];

      setProviders(providerList);
      setCredentials(credentialList);

      // 初始化选中状态
      if (credentialList.length > 0) {
        const savedProvider = localStorage.getItem(STORAGE_KEY_PROVIDER) as ProviderType | null;
        const savedCredential = localStorage.getItem(STORAGE_KEY_CREDENTIAL);

        // 获取有凭证的提供商列表
        const providersWithCreds = [...new Set(credentialList.map(c => c.provider))];

        const providerToSelect = (savedProvider && providersWithCreds.includes(savedProvider))
          ? savedProvider
          : (providersWithCreds.length > 0 ? providersWithCreds[0] : null);

        setSelectedProvider(providerToSelect);
        if (providerToSelect) {
          localStorage.setItem(STORAGE_KEY_PROVIDER, providerToSelect);
        }

        const credsForProvider = providerToSelect
          ? credentialList.filter(c => c.provider === providerToSelect)
          : [];

        let nextCredential: number | 'all' | null = null;

        if (savedCredential === 'all') {
          nextCredential = 'all';
        } else if (savedCredential) {
          const savedId = parseInt(savedCredential);
          if (credsForProvider.some(c => c.id === savedId)) {
            nextCredential = savedId;
          }
        }

        if (nextCredential === null) {
          nextCredential = credsForProvider.length > 1
            ? 'all'
            : credsForProvider.length === 1
              ? credsForProvider[0].id
              : 'all';
        }

        setSelectedCredentialId(nextCredential);
        if (nextCredential !== null) {
          localStorage.setItem(STORAGE_KEY_CREDENTIAL, String(nextCredential));
        }
      }
    } catch (err: any) {
      setError(err?.message || '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectProvider = useCallback((provider: ProviderType | null) => {
    if (provider === null) {
      setSelectedProvider(null);
      setSelectedCredentialId(null);
      localStorage.removeItem(STORAGE_KEY_PROVIDER);
      localStorage.removeItem(STORAGE_KEY_CREDENTIAL);
      return;
    }

    const credsForProvider = credentials.filter(c => c.provider === provider);
    const nextCredential = credsForProvider.length > 1
      ? 'all'
      : credsForProvider.length === 1
        ? credsForProvider[0].id
        : null;

    setSelectedProvider(provider);
    setSelectedCredentialId(nextCredential);
    localStorage.setItem(STORAGE_KEY_PROVIDER, provider);
    if (nextCredential !== null) {
      localStorage.setItem(STORAGE_KEY_CREDENTIAL, String(nextCredential));
    }
  }, [credentials]);

  const selectCredential = useCallback((id: number | 'all') => {
    setSelectedCredentialId(id);
    localStorage.setItem(STORAGE_KEY_CREDENTIAL, String(id));
  }, []);

  const getCredentialsByProvider = useCallback((provider: ProviderType) => {
    return credentials.filter(c => c.provider === provider);
  }, [credentials]);

  const getCredentialCountByProvider = useCallback((provider: ProviderType) => {
    return credentials.filter(c => c.provider === provider).length;
  }, [credentials]);

  const getProviderCapabilities = useCallback((provider?: ProviderType | null): ProviderCapabilities | null => {
    const p = provider ?? selectedProvider;
    if (!p) return null;
    const config = providers.find(c => c.type === p);
    return config?.capabilities ?? null;
  }, [providers, selectedProvider]);

  const currentCapabilities = getProviderCapabilities(selectedProvider);

  return (
    <ProviderContext.Provider
      value={{
        providers,
        credentials,
        selectedProvider,
        selectedCredentialId,
        isLoading,
        error,
        selectProvider,
        selectCredential,
        refreshData: loadData,
        getCredentialsByProvider,
        getCredentialCountByProvider,
        getProviderCapabilities,
        currentCapabilities,
      }}
    >
      {children}
    </ProviderContext.Provider>
  );
}

export function useProvider() {
  const context = useContext(ProviderContext);
  if (context === undefined) {
    throw new Error('useProvider must be used within a ProviderProvider');
  }
  return context;
}
