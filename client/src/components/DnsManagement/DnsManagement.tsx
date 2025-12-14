import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Dns as DnsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { getDNSRecords, createDNSRecord, updateDNSRecord, deleteDNSRecord, getDNSLines, setDNSRecordStatus } from '@/services/dns';
import DNSRecordTable from '@/components/DNSRecordTable/DNSRecordTable';
import QuickAddForm from '@/components/QuickAddForm/QuickAddForm';
import CustomHostnameList, { CustomHostnameListRef } from '@/components/CustomHostnameList/CustomHostnameList';
import { useProvider } from '@/contexts/ProviderContext';

interface DnsManagementProps {
  zoneId: string;
  credentialId?: number;
}

/**
 * Component for managing DNS records and Custom Hostnames for a specific domain.
 * Designed to be used within an expandable row in the Dashboard.
 */
export default function DnsManagement({ zoneId, credentialId }: DnsManagementProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { selectedProvider, credentials, currentCapabilities } = useProvider();
  const credentialProvider = typeof credentialId === 'number'
    ? credentials.find(c => c.id === credentialId)?.provider
    : selectedProvider;
  const supportsCustomHostnames = credentialProvider === 'cloudflare';
  const supportsLine = currentCapabilities?.supportsLine ?? false;
  const supportsStatus = currentCapabilities?.supportsStatus ?? false;
  const customHostnameListRef = useRef<CustomHostnameListRef>(null);

  const queryClient = useQueryClient();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dns-records', zoneId, credentialId],
    queryFn: () => getDNSRecords(zoneId, credentialId),
    enabled: !!zoneId,
  });

  // 获取线路列表
  const { data: linesData } = useQuery({
    queryKey: ['dns-lines', zoneId, credentialId],
    queryFn: () => getDNSLines(zoneId, credentialId),
    enabled: !!zoneId && supportsLine,
  });

  const createMutation = useMutation({
    mutationFn: (params: any) => createDNSRecord(zoneId, params, credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-records', zoneId, credentialId] });
      setShowQuickAdd(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ recordId, params }: { recordId: string, params: any }) => updateDNSRecord(zoneId, recordId, params, credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-records', zoneId, credentialId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (recordId: string) => deleteDNSRecord(zoneId, recordId, credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-records', zoneId, credentialId] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ recordId, enabled }: { recordId: string; enabled: boolean }) =>
      setDNSRecordStatus(zoneId, recordId, enabled, credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-records', zoneId, credentialId] });
    },
  });

  useEffect(() => {
    if (!supportsCustomHostnames && activeTab !== 0) {
      setActiveTab(0);
    }
  }, [supportsCustomHostnames, activeTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const records = data?.data?.records || [];
  const lines = linesData?.data?.lines || [];

  return (
    <Box sx={{ py: 2, px: 6, bgcolor: 'background.default' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 0 }}>
          <Tab label="DNS 记录" />
          {supportsCustomHostnames && <Tab label="自定义主机名" />}
        </Tabs>
        <Box sx={{ mb: 1, mr: 1 }}>
          {activeTab === 0 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setShowQuickAdd(true)}
            >
              添加记录
            </Button>
          )}
          {activeTab === 1 && supportsCustomHostnames && (
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SettingsIcon />}
                onClick={() => customHostnameListRef.current?.openFallbackDialog()}
              >
                管理回退源
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => customHostnameListRef.current?.openAddDialog()}
              >
                添加主机名
              </Button>
            </Stack>
          )}
        </Box>
      </Stack>

      {activeTab === 0 && (
        <>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
             <Alert severity="error" sx={{ m: 2 }}>
              {(error as any)?.message || String(error)}
            </Alert>
          ) : (
            <DNSRecordTable
              records={records}
              lines={lines}
              onUpdate={(recordId, params) => updateMutation.mutate({ recordId, params })}
              onDelete={(recordId) => {
                if (window.confirm('确定要删除这条 DNS 记录吗？')) {
                  deleteMutation.mutate(recordId);
                }
              }}
              onStatusChange={supportsStatus ? (recordId, enabled) => statusMutation.mutate({ recordId, enabled }) : undefined}
            />
          )}

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
                lines={lines}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setShowQuickAdd(false)} color="inherit">取消</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
      {supportsCustomHostnames && activeTab === 1 && (
        <CustomHostnameList ref={customHostnameListRef} zoneId={zoneId} credentialId={credentialId} />
      )}
    </Box>
  );
}