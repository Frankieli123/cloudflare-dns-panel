import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
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
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { getCustomHostnames, createCustomHostname, deleteCustomHostname } from '@/services/hostnames';
import { formatDateTime } from '@/utils/formatters';

/**
 * 自定义主机名管理页面
 */
export default function CustomHostnames() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [hostname, setHostname] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['custom-hostnames', zoneId],
    queryFn: () => getCustomHostnames(zoneId!),
    enabled: !!zoneId,
  });

  const createMutation = useMutation({
    mutationFn: (hostname: string) => createCustomHostname(zoneId!, hostname),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-hostnames', zoneId] });
      setShowAddDialog(false);
      setHostname('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (hostnameId: string) => deleteCustomHostname(zoneId!, hostnameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-hostnames', zoneId] });
    },
  });

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

  const hostnames = data?.data?.hostnames || [];

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          自定义主机名
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDialog(true)}
        >
          添加主机名
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
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
            {hostnames.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  暂无自定义主机名
                </TableCell>
              </TableRow>
            ) : (
              hostnames.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.hostname}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.ssl?.status || '未知'}
                      color={getSSLStatusColor(item.ssl?.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{item.ssl?.method?.toUpperCase() || '-'}</TableCell>
                  <TableCell>{formatDateTime(item.created_at)}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(item.id)}
                    >
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 添加主机名对话框 */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>添加自定义主机名</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="主机名"
            placeholder="example.com"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            margin="normal"
            helperText="输入您要添加的自定义域名"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>取消</Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={!hostname.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? '添加中...' : '添加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
