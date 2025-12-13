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
import AccountTabs from '@/components/AccountSwitcher/AccountTabs';
import { useAccount } from '@/contexts/AccountContext';

/**
 * 仪表盘页面 - 域名列表
 */
export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(null);
  const user = getStoredUser();
  const { currentAccountId } = useAccount();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['domains', currentAccountId],
    queryFn: () => getDomains(currentAccountId),
  });

  // 当账户切换时，清除搜索和展开状态
  useEffect(() => {
    setSearchTerm('');
    setExpandedDomainId(null);
  }, [currentAccountId]);

  const handleRefresh = async () => {
    await refreshDomains(currentAccountId);
    refetch();
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          欢迎回来, {user?.username} 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          您当前共有 <strong>{domains.length}</strong> 个域名，其中 <strong>{activeCount}</strong> 个正在运行。
        </Typography>
      </Box>

      {/* 账户切换 Tabs */}
      <AccountTabs />

      <Card sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
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
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={isRefetching}
              sx={{ borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
            >
              {isRefetching ? '刷新中...' : '同步列表'}
            </Button>
          </Stack>

          {error ? (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              无法加载域名列表: {(error as any)?.message || String(error)}
            </Alert>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell width={50} />
                    <TableCell>域名</TableCell>
                    {/* 如果是全部视图，显示账户列 */}
                    {currentAccountId === 'all' && <TableCell>所属账户</TableCell>}
                    <TableCell>状态</TableCell>
                    <TableCell>最后更新</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDomains.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={currentAccountId === 'all' ? 5 : 4} align="center" sx={{ py: 8 }}>
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

                            {/* 账户标签列 */}
                            {currentAccountId === 'all' && (
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
                              // @ts-ignore
                              color={status.color === 'default' ? 'default' : status.color}
                              size="small"
                              sx={{ 
                                bgcolor: (theme) => status.color !== 'default' ? alpha(theme.palette[status.color as 'success' | 'warning' | 'error'].main, 0.1) : undefined,
                                color: (theme) => status.color !== 'default' ? theme.palette[status.color as 'success' | 'warning' | 'error'].dark : undefined,
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
                          <TableCell style={{ padding: 0 }} colSpan={currentAccountId === 'all' ? 5 : 4}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <DnsManagement zoneId={domain.id} />
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
