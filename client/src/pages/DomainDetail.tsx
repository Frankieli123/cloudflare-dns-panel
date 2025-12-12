import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { getDNSRecords, createDNSRecord, updateDNSRecord, deleteDNSRecord } from '@/services/dns';
import DNSRecordTable from '@/components/DNSRecordTable/DNSRecordTable';
import QuickAddForm from '@/components/QuickAddForm/QuickAddForm';

/**
 * 域名详情页面 - DNS 记录管理
 */
export default function DomainDetail() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const queryClient = useQueryClient();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dns-records', zoneId],
    queryFn: () => getDNSRecords(zoneId!),
    enabled: !!zoneId,
  });

  const createMutation = useMutation({
    mutationFn: (params: any) => createDNSRecord(zoneId!, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-records', zoneId] });
      setShowQuickAdd(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ recordId, params }: any) => updateDNSRecord(zoneId!, recordId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-records', zoneId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (recordId: string) => deleteDNSRecord(zoneId!, recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dns-records', zoneId] });
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error as string}
      </Alert>
    );
  }

  const records = data?.data?.records || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          DNS 记录管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowQuickAdd(true)}
        >
          快速添加
        </Button>
      </Box>

      <Paper>
        <DNSRecordTable
          records={records}
          onUpdate={(recordId, params) => updateMutation.mutate({ recordId, params })}
          onDelete={(recordId) => {
            if (window.confirm('确定要删除这条 DNS 记录吗？')) {
              deleteMutation.mutate(recordId);
            }
          }}
        />
      </Paper>

      {/* 快速添加对话框 */}
      <Dialog open={showQuickAdd} onClose={() => setShowQuickAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>快速添加 DNS 记录</DialogTitle>
        <DialogContent>
          <QuickAddForm
            onSubmit={(params) => createMutation.mutate(params)}
            loading={createMutation.isPending}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQuickAdd(false)}>取消</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
