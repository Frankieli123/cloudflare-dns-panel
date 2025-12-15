import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Breadcrumbs,
  Link,
  Stack,
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  NavigateNext as NavigateNextIcon,
  Language as LanguageIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { getCustomHostnames, createCustomHostname, deleteCustomHostname } from '@/services/hostnames';
import { formatDateTime } from '@/utils/formatters';
import { useProvider } from '@/contexts/ProviderContext';

/**
 * 自定义主机名管理页面
 */
export default function CustomHostnames() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [hostname, setHostname] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const { selectedCredentialId } = useProvider();
  const credParam = new URLSearchParams(location.search).get('credentialId');
  const parsedCredId = credParam ? parseInt(credParam, 10) : undefined;
  const credFromQuery = typeof parsedCredId === 'number' && Number.isFinite(parsedCredId)
    ? parsedCredId
    : undefined;
  const credentialId = typeof credFromQuery === 'number'
    ? credFromQuery
    : (typeof selectedCredentialId === 'number' ? selectedCredentialId : undefined);
  const missingCredentialContext = selectedCredentialId === 'all' && typeof credFromQuery !== 'number';
  const queriesEnabled = !!zoneId && !missingCredentialContext;

  const { data, isLoading, error } = useQuery({
    queryKey: ['custom-hostnames', zoneId, credentialId],
    queryFn: () => getCustomHostnames(zoneId!, credentialId),
    enabled: queriesEnabled,
  });

  const createMutation = useMutation({
    mutationFn: (hostname: string) => createCustomHostname(zoneId!, hostname, credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-hostnames', zoneId, credentialId] });
      setShowAddDialog(false);
      setHostname('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (hostnameId: string) => deleteCustomHostname(zoneId!, hostnameId, credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-hostnames', zoneId, credentialId] });
    },
  });

  if (missingCredentialContext) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        请从域名列表进入该页面，或在地址栏携带 credentialId 参数（例如：?credentialId=123）。
      </Alert>
    );
  }

  const handleAdd = () => {
    if (hostname.trim()) {
      createMutation.mutate(hostname);
    }
  };

  const handleDelete = (hostnameId: string) => {
    if (window.confirm('确定要删除这个自定义主机名吗？')) {
      deleteMutation.mutate(hostnameId);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    const errorMessage = (error as any)?.message || String(error);
    const isAuthError = errorMessage.includes('403') || errorMessage.includes('Authentication error');

    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <IconButton onClick={() => navigate('/')} size="small">
              <ArrowBackIcon />
            </IconButton>
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
              <Link
                underline="hover"
                color="inherit"
                onClick={() => navigate('/')}
                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                仪表盘
              </Link>
              <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                自定义主机名
              </Typography>
            </Breadcrumbs>
          </Stack>

          <Typography variant="h4" component="h1" fontWeight="bold">
            自定义主机名
          </Typography>
        </Box>

        <Alert severity={isAuthError ? 'warning' : 'error'} sx={{ mt: 2 }}>
          {isAuthError ? (
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                权限不足或功能不可用
              </Typography>
              <Typography variant="body2" paragraph>
                无法访问自定义主机名功能。可能的原因：
              </Typography>
              <Typography variant="body2" component="div">
                1. API Token 缺少 "SSL and Certificates: Edit" 权限<br/>
                2. 当前账户套餐不支持 Custom Hostnames 功能（需要 Business 或 Enterprise 套餐）<br/>
                3. 该域名未启用 Custom Hostnames 功能
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                请检查您的 Cloudflare API Token 权限或账户套餐。
              </Typography>
            </Box>
          ) : (
            errorMessage
          )}
        </Alert>
      </Box>
    );
  }

  const hostnames = data?.data?.hostnames || [];

  const filteredHostnames = searchKeyword.trim()
    ? hostnames.filter((item: any) => {
        const keyword = searchKeyword.toLowerCase();
        return (
          item.hostname?.toLowerCase().includes(keyword) ||
          item.ssl?.status?.toLowerCase().includes(keyword)
        );
      })
    : hostnames;

  const getSSLStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending_validation':
        return 'warning';
      case 'pending_deployment':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* 顶部操作栏 */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <TextField
            size="small"
            placeholder="搜索主机名..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            sx={{ width: 240 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDialog(true)}
            sx={{ px: 3 }}
          >
            添加主机名
          </Button>
        </Stack>
      </Box>

      <Card sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>主机名</TableCell>
                  <TableCell>SSL 状态</TableCell>
                  <TableCell>验证方法</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHostnames.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                       <Typography variant="body1" color="text.secondary">
                        暂无自定义主机名
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHostnames.map((item: any) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          {item.hostname}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.ssl?.status || '未知'}
                          color={getSSLStatusColor(item.ssl?.status) as any}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>{item.ssl?.method?.toUpperCase() || '-'}</TableCell>
                      <TableCell>{formatDateTime(item.created_at)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="删除主机名">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(item.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 添加主机名对话框 */}
      <Dialog 
        open={showAddDialog} 
        onClose={() => setShowAddDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LanguageIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">添加自定义主机名</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="主机名"
            placeholder="example.com"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            helperText="输入您要添加的自定义域名，需要先在 DNS 中配置 CNAME 记录。"
            InputProps={{
              startAdornment: <LanguageIcon color="action" sx={{ mr: 1 }} />
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setShowAddDialog(false)} color="inherit">取消</Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={!hostname.trim() || createMutation.isPending}
            sx={{ minWidth: 100 }}
          >
            {createMutation.isPending ? '添加中...' : '添加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
