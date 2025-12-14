import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Skeleton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CloudQueue as CloudflareIcon,
  Storage as AliyunIcon,
  Language as DnspodIcon,
  Cloud as HuaweiIcon,
  CloudCircle as BaiduIcon,
  Public as WestIcon,
  Whatshot as HuoshanIcon,
  CloudDone as JdcloudIcon,
  Dns as DnslaIcon,
  Label as NamesiloIcon,
  PowerSettingsNew as PowerdnsIcon,
  RocketLaunch as SpaceshipIcon,
} from '@mui/icons-material';
import { useProvider } from '@/contexts/ProviderContext';
import { ProviderType } from '@/types/dns';

const PROVIDER_CONFIG: Record<ProviderType, { icon: React.ReactNode; color: string; name: string }> = {
  cloudflare: { icon: <CloudflareIcon />, color: '#f38020', name: 'Cloudflare' },
  aliyun: { icon: <AliyunIcon />, color: '#ff6a00', name: '阿里云 DNS' },
  dnspod: { icon: <DnspodIcon />, color: '#0052d9', name: 'DNSPod' },
  huawei: { icon: <HuaweiIcon />, color: '#e60012', name: '华为云 DNS' },
  baidu: { icon: <BaiduIcon />, color: '#2932e1', name: '百度云 DNS' },
  west: { icon: <WestIcon />, color: '#1e88e5', name: '西部数码' },
  huoshan: { icon: <HuoshanIcon />, color: '#1f54f7', name: '火山引擎' },
  jdcloud: { icon: <JdcloudIcon />, color: '#e1251b', name: '京东云 DNS' },
  dnsla: { icon: <DnslaIcon />, color: '#4caf50', name: 'DNSLA' },
  namesilo: { icon: <NamesiloIcon />, color: '#2196f3', name: 'NameSilo' },
  powerdns: { icon: <PowerdnsIcon />, color: '#333333', name: 'PowerDNS' },
  spaceship: { icon: <SpaceshipIcon />, color: '#7e57c2', name: 'Spaceship' },
};

const PROVIDER_ORDER: ProviderType[] = [
  'cloudflare', 'aliyun', 'dnspod', 'huawei', 'baidu', 'west',
  'huoshan', 'jdcloud', 'dnsla', 'namesilo', 'powerdns', 'spaceship',
];

export default function ProviderSidebar() {
  const theme = useTheme();
  const {
    providers,
    selectedProvider,
    selectProvider,
    getCredentialCountByProvider,
    isLoading,
  } = useProvider();

  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, px: 1 }}>
          DNS 提供商
        </Typography>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={72}
            sx={{ mb: 1.5, borderRadius: 2 }}
          />
        ))}
      </Box>
    );
  }

  // 按固定顺序显示提供商
  const sortedProviders = PROVIDER_ORDER
    .map(type => providers.find(p => p.type === type))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ mb: 2, px: 1, fontWeight: 600 }}
      >
        DNS 提供商
      </Typography>

      {sortedProviders.map((provider) => {
        const config = PROVIDER_CONFIG[provider.type];
        const count = getCredentialCountByProvider(provider.type);
        const isSelected = selectedProvider === provider.type;
        const hasAccounts = count > 0;

        return (
          <Card
            key={provider.type}
            variant="outlined"
            onClick={() => hasAccounts && selectProvider(provider.type)}
            sx={{
              mb: 1.5,
              cursor: hasAccounts ? 'pointer' : 'not-allowed',
              opacity: hasAccounts ? 1 : 0.5,
              borderColor: isSelected ? config.color : 'divider',
              borderWidth: isSelected ? 2 : 1,
              bgcolor: isSelected ? alpha(config.color, 0.04) : 'background.paper',
              transition: 'all 0.2s ease',
              '&:hover': hasAccounts ? {
                borderColor: config.color,
                transform: 'translateX(4px)',
                boxShadow: `0 4px 12px ${alpha(config.color, 0.15)}`,
              } : {},
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(config.color, 0.1),
                    color: config.color,
                    '& svg': { fontSize: 24 },
                  }}
                >
                  {config.icon}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{
                      color: isSelected ? config.color : 'text.primary',
                    }}
                  >
                    {config.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {count > 0 ? `${count} 个账户` : '未配置'}
                  </Typography>
                </Box>

                {count > 0 && (
                  <Chip
                    label={count}
                    size="small"
                    sx={{
                      height: 24,
                      minWidth: 24,
                      bgcolor: isSelected ? config.color : alpha(theme.palette.text.primary, 0.08),
                      color: isSelected ? 'white' : 'text.secondary',
                      fontWeight: 600,
                      '& .MuiChip-label': { px: 1 },
                    }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        );
      })}

      {sortedProviders.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            暂无可用提供商
          </Typography>
        </Box>
      )}
    </Box>
  );
}
