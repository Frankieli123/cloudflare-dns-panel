import { useState } from 'react';
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
  Dns as DnsIcon
} from '@mui/icons-material';
import { getDNSRecords, createDNSRecord, updateDNSRecord, deleteDNSRecord } from '@/services/dns';
import DNSRecordTable from '@/components/DNSRecordTable/DNSRecordTable';
import QuickAddForm from '@/components/QuickAddForm/QuickAddForm';
import CustomHostnameList from '@/components/CustomHostnameList/CustomHostnameList';

interface DnsManagementProps {
  zoneId: string;
}

function DnsRecordList({ zoneId }: { zoneId: string }) {
  const queryClient = useQueryClient();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dns-records', zoneId],
    queryFn: () => getDNSRecords(zoneId),
    enabled: !!zoneId,
  });

  const createMutation = useMutation({
    mutationFn: (params: any) => createDNSRecord(zoneId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-records', zoneId] });
      setShowQuickAdd(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ recordId, params }: { recordId: string, params: any }) => updateDNSRecord(zoneId, recordId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-records', zoneId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (recordId: string) => deleteDNSRecord(zoneId, recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-records', zoneId] });
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {(error as any)?.message || String(error)}
      </Alert>
    );
  }

  const records = data?.data?.records || [];

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setShowQuickAdd(true)}
        >
          添加记录
        </Button>
      </Stack>

      <DNSRecordTable
        records={records}
        onUpdate={(recordId, params) => updateMutation.mutate({ recordId, params })}
        onDelete={(recordId) => {
          if (window.confirm('确定要删除这条 DNS 记录吗？')) {
            deleteMutation.mutate(recordId);
          }
        }}
      />

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

/**
 * Component for managing DNS records and Custom Hostnames for a specific domain.
 * Designed to be used within an expandable row in the Dashboard.
 */
export default function DnsManagement({ zoneId }: DnsManagementProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ py: 2, px: 6, bgcolor: 'background.default' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="DNS 记录" />
          <Tab label="自定义主机名" />
        </Tabs>
      </Box>

      {activeTab === 0 && <DnsRecordList zoneId={zoneId} />}
      {activeTab === 1 && <CustomHostnameList zoneId={zoneId} />}
    </Box>
  );
}
