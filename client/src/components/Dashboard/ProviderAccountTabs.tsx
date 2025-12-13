import { Box, Tabs, Tab, Skeleton } from '@mui/material';
import {
  Apps as AllIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { useProvider } from '@/contexts/ProviderContext';

export default function ProviderAccountTabs() {
  const {
    selectedProvider,
    selectedCredentialId,
    selectCredential,
    getCredentialsByProvider,
    isLoading,
  } = useProvider();

  if (isLoading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  if (!selectedProvider) {
    return null;
  }

  const accounts = getCredentialsByProvider(selectedProvider);

  if (accounts.length === 0) {
    return null;
  }

  const handleChange = (_event: React.SyntheticEvent, newValue: number | 'all') => {
    selectCredential(newValue);
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
      <Tabs
        value={selectedCredentialId || 'all'}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="account tabs"
        sx={{
          minHeight: 48,
          px: 2,
          '& .MuiTab-root': {
            minHeight: 48,
            textTransform: 'none',
            fontWeight: 600,
          },
        }}
      >
        <Tab
          value="all"
          label="全部账户"
          icon={<AllIcon fontSize="small" />}
          iconPosition="start"
        />

        {accounts.map((account) => (
          <Tab
            key={account.id}
            value={account.id}
            label={account.name}
            icon={<AccountIcon fontSize="small" />}
            iconPosition="start"
          />
        ))}
      </Tabs>
    </Box>
  );
}
