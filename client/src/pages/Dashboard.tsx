import { useState, Fragment, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Stack,
  IconButton,
  Collapse,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Dns as DnsIcon,
  CheckCircle as ActiveIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { getDomains, refreshDomains } from '@/services/domains';
import { formatRelativeTime } from '@/utils/formatters';
import { getStoredUser } from '@/services/auth';
import { alpha } from '@mui/material/styles';
import { Domain } from '@/types';
import DnsManagement from '@/components/DnsManagement/DnsManagement';
import ProviderAccountTabs from '@/components/Dashboard/ProviderAccountTabs';
import { useProvider } from '@/contexts/ProviderContext';

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(null);
  const user = getStoredUser();

  const { selectedCredentialId, selectedProvider, getCredentialsByProvider } = useProvider();

  const currentProviderCredentials = selectedProvider
    ? getCredentialsByProvider(selectedProvider)
    : [];

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['domains', selectedProvider, selectedCredentialId],
    queryFn: async () => {
      if (!selectedProvider || currentProviderCredentials.length === 0) {
        return { data: { domains: [] } };
      }

      if (selectedCredentialId === 'all') {
        const results = await Promise.allSettled(
          currentProviderCredentials.map(cred => getDomains(cred.id))
        );

        const allDomains: Domain[] = [];
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.data?.domains) {
            const cred = currentProviderCredentials[index];
            result.value.data.domains.forEach(domain => {
              allDomains.push({
                ...domain,
                credentialId: cred.id,
                credentialName: cred.name,
              });
            });
          }
        });

        return { data: { domains: allDomains } };
      }

      return getDomains(selectedCredentialId);
    },
    enabled: !!selectedProvider && currentProviderCredentials.length > 0,
  });

  useEffect(() => {
    setSearchTerm('');
    setExpandedDomainId(null);
  }, [selectedCredentialId, selectedProvider]);

  const handleRefresh = async () => {
    if (selectedProvider) {
      if (selectedCredentialId === 'all') {
        await Promise.all(currentProviderCredentials.map(c => refreshDomains(c.id)));
      } else if (selectedCredentialId) {
        await refreshDomains(selectedCredentialId);
      }
      refetch();
    }
  };

  const domains: Domain[] = data?.data?.domains || [];
  const filteredDomains = domains.filter((domain) =>
    domain.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = domains.filter(d => d.status === 'active').length;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: '已激活', color: 'success' as const, icon: <ActiveIcon fontSize="small" /> };
      case 'pending':
        return { label: '待验证', color: 'warning' as const, icon: <PendingIcon fontSize="small" /> };
      case 'moved':
        return { label: '已迁出', color: 'error' as const, icon: <ErrorIcon fontSize="small" /> };
      default:
        return { label: status, color: 'default' as const, icon: null };
    }
  };

  const showAccountColumn = selectedCredentialId === 'all' && currentProviderCredentials.length > 1;

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
      {/* 域名列表卡片 (包含顶部的 Tabs) */}
      <Card sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* 将 Tabs 整合到卡片顶部 */}
        <Box sx={{ bgcolor: 'background.paper' }}>
           <ProviderAccountTabs />
           <Divider />
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ mb: 3 }}
          >
            <TextField
              placeholder="搜索域名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: { xs: '100%', sm: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              disabled={!selectedProvider}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={isRefetching || !selectedProvider}
              sx={{
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
              }}
            >
              {isRefetching ? '刷新中...' : '同步列表'}
            </Button>
          </Stack>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              无法加载域名列表: {(error as any)?.message || String(error)}
            </Alert>
          ) : !selectedProvider ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, color: 'text.secondary' }}>
              <DnsIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
              <Typography variant="body1">请在左侧选择一个 DNS 提供商以查看域名</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell width={50} />
                    <TableCell>域名</TableCell>
                    {showAccountColumn && <TableCell>所属账户</TableCell>}
                    <TableCell>状态</TableCell>
                    <TableCell>最后更新</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDomains.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={showAccountColumn ? 5 : 4} align="center" sx={{ py: 8 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.secondary' }}>
                          <DnsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.2 }} />
                          <Typography variant="body1">
                            {searchTerm ? '没有找到匹配的域名' : '暂无域名数据'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDomains.map((domain) => {
                      const status = getStatusConfig(domain.status);
                      const isExpanded = expandedDomainId === domain.id;

                      return (
                        <Fragment key={`${domain.id}-${domain.credentialId}`}>
                          <TableRow
                            hover
                            sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }}
                            onClick={() => setExpandedDomainId(isExpanded ? null : domain.id)}
                          >
                            <TableCell>
                              <IconButton
                                aria-label="expand row"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedDomainId(isExpanded ? null : domain.id);
                                }}
                              >
                                {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                              </IconButton>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1" fontWeight="600" color="text.primary">
                                {domain.name}
                              </Typography>
                            </TableCell>

                            {showAccountColumn && (
                              <TableCell>
                                <Chip
                                  size="small"
                                  icon={<BusinessIcon style={{ fontSize: 14 }} />}
                                  label={domain.credentialName || '未知账户'}
                                  variant="outlined"
                                  sx={{ fontSize: '0.75rem', height: 24, borderRadius: 1 }}
                                />
                              </TableCell>
                            )}

                            <TableCell>
                              <Chip
                                icon={status.icon || undefined}
                                label={status.label}
                                color={status.color === 'default' ? 'default' : status.color}
                                size="small"
                                sx={{
                                  bgcolor: (theme) => status.color !== 'default'
                                    ? alpha(theme.palette[status.color as 'success' | 'warning' | 'error'].main, 0.1)
                                    : undefined,
                                  color: (theme) => status.color !== 'default'
                                    ? theme.palette[status.color as 'success' | 'warning' | 'error'].dark
                                    : undefined,
                                  fontWeight: 600,
                                  border: 'none',
                                  '& .MuiChip-icon': { color: 'inherit' }
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>
                              {domain.updatedAt ? formatRelativeTime(domain.updatedAt) : '-'}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell style={{ padding: 0 }} colSpan={showAccountColumn ? 5 : 4}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <DnsManagement zoneId={domain.id} credentialId={domain.credentialId} />
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
