import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  NavigateNext as NavigateNextIcon,
  Dns as DnsIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { getDNSRecords, createDNSRecord, updateDNSRecord, deleteDNSRecord } from '@/services/dns';
import DNSRecordTable from '@/components/DNSRecordTable/DNSRecordTable';
import QuickAddForm from '@/components/QuickAddForm/QuickAddForm';
import { useProvider } from '@/contexts/ProviderContext';

/**
 * 域名详情页面 - DNS 记录管理
 */
export default function DomainDetail() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { selectedCredentialId, selectedProvider, credentials } = useProvider();
  const credentialId = typeof selectedCredentialId === 'number' ? selectedCredentialId : undefined;
  const credentialProvider = credentialId
    ? credentials.find(c => c.id === credentialId)?.provider
    : selectedProvider;
  const supportsCustomHostnames = credentialProvider === 'cloudflare';

  // 获取域名信息（这里假设从缓存或上一页传递，如果没有独立API，先简单处理）
  // 实际项目中可能需要单独获取域名详情的API，或者从 location state 获取
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dns-records', zoneId, credentialId],
    queryFn: () => getDNSRecords(zoneId!, credentialId),
    enabled: !!zoneId,
  });

  const createMutation = useMutation({
    mutationFn: (params: any) => createDNSRecord(zoneId!, params, credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-records', zoneId, credentialId] });
      setShowQuickAdd(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ recordId, params }: any) => updateDNSRecord(zoneId!, recordId, params, credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-records', zoneId, credentialId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (recordId: string) => deleteDNSRecord(zoneId!, recordId, credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-records', zoneId, credentialId] });
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {(error as any)?.message || String(error)}
      </Alert>
    );
  }

  const records = data?.data?.records || [];

  return (
    <Box>
      {/* 顶部导航 */}
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
              DNS 管理
            </Typography>
          </Breadcrumbs>
        </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" component="h1" fontWeight="bold">
                        DNS 记录
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                        管理当前域名的解析记录
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                      {supportsCustomHostnames && (
                        <Button
                          variant="outlined"
                          startIcon={<LanguageIcon />}
                          onClick={() => {
                            console.log('点击自定义主机名按钮, zoneId:', zoneId);
                            console.log('跳转路径:', `/hostnames/${zoneId}`);
                            navigate(credentialId ? `/hostnames/${zoneId}?credentialId=${credentialId}` : `/hostnames/${zoneId}`);
                          }}
                          sx={{ px: 3 }}
                        >
                          自定义主机名
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowQuickAdd(true)}
                        sx={{ px: 3 }}
                      >
                        添加记录
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
      <Card sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 0 }}>
          <DNSRecordTable
            records={records}
            onUpdate={(recordId, params) => updateMutation.mutate({ recordId, params })}
            onDelete={(recordId) => {
              if (window.confirm('确定要删除这条 DNS 记录吗？')) {
                deleteMutation.mutate(recordId);
              }
            }}
          />
        </CardContent>
      </Card>

      {/* 快速添加对话框 */}
      <Dialog 
        open={showQuickAdd} 
        onClose={() => setShowQuickAdd(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <DnsIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">添加 DNS 记录</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <QuickAddForm
            onSubmit={(params) => createMutation.mutate(params)}
            loading={createMutation.isPending}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setShowQuickAdd(false)} color="inherit">取消</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
