import { Box, Card, CardContent, Grid, Typography, Radio, FormControlLabel, alpha, useTheme } from '@mui/material';
import {
  CloudQueue,
  Storage,
  Language,
  Cloud,
  CloudCircle,
  Public,
  Whatshot,
  CloudDone,
  Dns,
  Label,
  PowerSettingsNew,
  RocketLaunch,
} from '@mui/icons-material';
import { ProviderConfig, ProviderType } from '@/types/dns';

interface ProviderSelectorProps {
  providers: ProviderConfig[];
  selectedProvider: ProviderType | null;
  onSelect: (provider: ProviderType) => void;
}

const PROVIDER_COLORS: Record<string, string> = {
  cloudflare: '#f38020',
  aliyun: '#ff6a00',
  dnspod: '#0052d9',
  huawei: '#e60012',
  baidu: '#2932e1',
  west: '#1e88e5',
  huoshan: '#1f54f7',
  jdcloud: '#e1251b',
  dnsla: '#4caf50',
  namesilo: '#2196f3',
  powerdns: '#333333',
  spaceship: '#7e57c2',
};

export const getProviderIcon = (type: string, size: 'small' | 'large' = 'large') => {
  const fontSize = size === 'large' ? 'large' : 'small';
  const color = PROVIDER_COLORS[type] || '#757575';
  const sx = { color };

  switch (type) {
    case 'cloudflare':
      return <CloudQueue fontSize={fontSize} sx={sx} />;
    case 'aliyun':
      return <Storage fontSize={fontSize} sx={sx} />;
    case 'dnspod':
      return <Language fontSize={fontSize} sx={sx} />;
    case 'huawei':
      return <Cloud fontSize={fontSize} sx={sx} />;
    case 'baidu':
      return <CloudCircle fontSize={fontSize} sx={sx} />;
    case 'west':
      return <Public fontSize={fontSize} sx={sx} />;
    case 'huoshan':
      return <Whatshot fontSize={fontSize} sx={sx} />;
    case 'jdcloud':
      return <CloudDone fontSize={fontSize} sx={sx} />;
    case 'dnsla':
      return <Dns fontSize={fontSize} sx={sx} />;
    case 'namesilo':
      return <Label fontSize={fontSize} sx={sx} />;
    case 'powerdns':
      return <PowerSettingsNew fontSize={fontSize} sx={sx} />;
    case 'spaceship':
      return <RocketLaunch fontSize={fontSize} sx={sx} />;
    default:
      return <Language fontSize={fontSize} sx={sx} />;
  }
};

export default function ProviderSelector({ providers, selectedProvider, onSelect }: ProviderSelectorProps) {
  const theme = useTheme();

  return (
    <Box sx={{ maxHeight: '60vh', overflowY: 'auto', p: 0.5 }}>
      <Grid container spacing={2}>
        {providers.map((provider) => {
          const providerType = provider.type;
          const isSelected = !!providerType && selectedProvider === providerType;
          const brandColor = PROVIDER_COLORS[providerType] || theme.palette.primary.main;

          return (
            <Grid item xs={6} sm={4} md={3} key={provider.type || provider.name}>
              <Card
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  borderColor: isSelected ? brandColor : undefined,
                  bgcolor: isSelected ? alpha(brandColor, 0.04) : undefined,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: brandColor,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(brandColor, 0.15)}`
                  }
                }}
                onClick={() => {
                  if (!providerType) return;
                  onSelect(providerType);
                }}
              >
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                  <Box mb={1.5} sx={{
                    p: 1.5,
                    borderRadius: '50%',
                    bgcolor: alpha(brandColor, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getProviderIcon(provider.type)}
                  </Box>
                  <Typography variant="subtitle2" fontWeight="bold" align="center" noWrap sx={{ width: '100%', mb: 1 }}>
                    {provider.name}
                  </Typography>
                  <FormControlLabel
                    value={provider.type}
                    control={
                      <Radio
                        checked={isSelected}
                        sx={{
                          p: 0.5,
                          color: isSelected ? brandColor : undefined,
                          '&.Mui-checked': { color: brandColor }
                        }}
                      />
                    }
                    label={isSelected ? "已选" : "选择"}
                    sx={{ m: 0, '& .MuiTypography-root': { fontSize: '0.75rem', color: 'text.secondary' } }}
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
