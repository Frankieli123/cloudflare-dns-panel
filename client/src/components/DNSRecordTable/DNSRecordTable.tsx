import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  Tooltip,
  Typography,
  TextField,
  MenuItem,
  Switch,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Cloud as CloudIcon, 
  CloudQueue as CloudQueueIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DNSRecord } from '@/types';
import { formatTTL } from '@/utils/formatters';
import { DNS_RECORD_TYPES, TTL_OPTIONS } from '@/utils/constants';

interface DNSRecordTableProps {
  records: DNSRecord[];
  onUpdate: (recordId: string, params: any) => void;
  onDelete: (recordId: string) => void;
}

/**
 * DNS 记录表格组件
 */
export default function DNSRecordTable({ records, onUpdate, onDelete }: DNSRecordTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DNSRecord>>({});

  const handleEditClick = (record: DNSRecord) => {
    setEditingId(record.id);
    setEditForm({
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl,
      proxied: record.proxied,
      priority: record.priority
    });
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveClick = (recordId: string) => {
    onUpdate(recordId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleChange = (field: keyof DNSRecord, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Table sx={{ minWidth: 650 }}>
      <TableHead>
        <TableRow>
          <TableCell>类型</TableCell>
          <TableCell>名称</TableCell>
          <TableCell sx={{ maxWidth: 300 }}>内容</TableCell>
          <TableCell>TTL</TableCell>
          <TableCell align="center">代理状态</TableCell>
          <TableCell>优先级</TableCell>
          <TableCell align="right">操作</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {records.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                暂无 DNS 记录
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          records.map((record) => {
            const isEditing = editingId === record.id;
            
            if (isEditing) {
              return (
                <TableRow key={record.id} hover>
                   <TableCell>
                    <TextField
                      select
                      size="small"
                      value={editForm.type}
                      onChange={(e) => handleChange('type', e.target.value)}
                      sx={{ minWidth: 80 }}
                    >
                      {DNS_RECORD_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </TextField>
                   </TableCell>
                   <TableCell>
                    <TextField
                      size="small"
                      value={editForm.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                   </TableCell>
                   <TableCell sx={{ maxWidth: 300 }}>
                    <TextField
                      size="small"
                      fullWidth
                      value={editForm.content}
                      onChange={(e) => handleChange('content', e.target.value)}
                    />
                   </TableCell>
                   <TableCell>
                    <TextField
                      select
                      size="small"
                      value={editForm.ttl}
                      onChange={(e) => handleChange('ttl', Number(e.target.value))}
                      sx={{ minWidth: 100 }}
                    >
                      {TTL_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </TextField>
                   </TableCell>
                   <TableCell align="center">
                    <Switch
                      checked={!!editForm.proxied}
                      onChange={(e) => handleChange('proxied', e.target.checked)}
                    />
                   </TableCell>
                   <TableCell>
                     {(editForm.type === 'MX' || editForm.type === 'SRV') && (
                       <TextField
                         type="number"
                         size="small"
                         value={editForm.priority}
                         onChange={(e) => handleChange('priority', Number(e.target.value))}
                         sx={{ maxWidth: 80 }}
                       />
                     )}
                   </TableCell>
                   <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <IconButton size="small" onClick={() => handleSaveClick(record.id)} color="success">
                        <CheckIcon />
                      </IconButton>
                      <IconButton size="small" onClick={handleCancelClick} color="default">
                        <CloseIcon />
                      </IconButton>
                    </Box>
                   </TableCell>
                </TableRow>
              );
            }

            return (
              <TableRow key={record.id} hover>
                <TableCell>
                  <Chip 
                    label={record.type} 
                    size="small" 
                    sx={{ 
                      fontWeight: 'bold',
                      minWidth: 60,
                      bgcolor: (theme) => theme.palette.primary.main,
                      color: 'white'
                    }} 
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="500">
                    {record.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 300, wordBreak: 'break-all' }}>
                  <Typography variant="body2" fontFamily="monospace" fontSize="0.85rem">
                    {record.content}
                  </Typography>
                </TableCell>
                <TableCell>{formatTTL(record.ttl)}</TableCell>
                <TableCell align="center">
                  {record.proxied ? (
                    <Tooltip title="已开启 Cloudflare 代理">
                      <CloudIcon color="warning" />
                    </Tooltip>
                  ) : (
                    <Tooltip title="仅 DNS 解析 (无代理)">
                      <CloudQueueIcon color="disabled" />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>{record.priority || '-'}</TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Tooltip title="编辑记录">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(record)}
                        sx={{ color: 'primary.main' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="删除记录">
                      <IconButton
                        size="small"
                        onClick={() => onDelete(record.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
