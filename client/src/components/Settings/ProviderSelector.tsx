import { Box, Card, CardContent, Grid, Typography, Radio, FormControlLabel, alpha, useTheme } from '@mui/material';
import { CloudQueue, Storage, Language } from '@mui/icons-material';
import { ProviderConfig, ProviderType } from '@/types/dns';

interface ProviderSelectorProps {
  providers: ProviderConfig[];
  selectedProvider: ProviderType | null;
  onSelect: (provider: ProviderType) => void;
}

export const getProviderIcon = (type: string, size: 'small' | 'large' = 'large') => {
  const fontSize = size === 'large' ? 'large' : 'small';
  switch (type) {
    case 'cloudflare':
      return <CloudQueue fontSize={fontSize} sx={{ color: '#f38020' }} />;
    case 'aliyun':
      return <Storage fontSize={fontSize} sx={{ color: '#ff6a00' }} />;
    case 'dnspod':
      return <Language fontSize={fontSize} sx={{ color: '#0052d9' }} />;
    default:
      return <Language fontSize={fontSize} />;
  }
};

export default function ProviderSelector({ providers, selectedProvider, onSelect }: ProviderSelectorProps) {
  const theme = useTheme();

  return (
    <Grid container spacing={2}>
      {providers.map((provider) => {
        const providerType = provider.type;
        const isSelected = !!providerType && selectedProvider === providerType;
        return (
          <Grid item xs={12} sm={4} key={provider.type || provider.name}>
            <Card
              variant="outlined"
              sx={{
                cursor: 'pointer',
                borderColor: isSelected ? 'primary.main' : undefined,
                bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.04) : undefined,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
              onClick={() => {
                if (!providerType) return;
                onSelect(providerType);
              }}
            >
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                <Box mb={2}>
                  {getProviderIcon(provider.type)}
                </Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {provider.name}
                </Typography>
                <FormControlLabel
                  value={provider.type}
                  control={<Radio checked={isSelected} />}
                  label={isSelected ? "已选择" : "选择"}
                  sx={{ m: 0, '& .MuiTypography-root': { fontSize: '0.875rem', color: 'text.secondary' } }}
                />
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
