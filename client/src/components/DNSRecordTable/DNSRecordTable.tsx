import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Cloud as CloudIcon } from '@mui/icons-material';
import { DNSRecord } from '@/types';
import { formatTTL } from '@/utils/formatters';

interface DNSRecordTableProps {
  records: DNSRecord[];
  onUpdate: (recordId: string, params: any) => void;
  onDelete: (recordId: string) => void;
}

/**
 * DNS 记录表格组件
 */
export default function DNSRecordTable({ records, onUpdate, onDelete }: DNSRecordTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>类型</TableCell>
          <TableCell>名称</TableCell>
          <TableCell>内容</TableCell>
          <TableCell>TTL</TableCell>
          <TableCell>代理</TableCell>
          <TableCell>优先级</TableCell>
          <TableCell align="right">操作</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {records.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} align="center">
              暂无 DNS 记录
            </TableCell>
          </TableRow>
        ) : (
          records.map((record) => (
            <TableRow key={record.id} hover>
              <TableCell>
                <Chip label={record.type} size="small" color="primary" />
              </TableCell>
              <TableCell>{record.name}</TableCell>
              <TableCell>{record.content}</TableCell>
              <TableCell>{formatTTL(record.ttl)}</TableCell>
              <TableCell>
                {record.proxied ? (
                  <CloudIcon color="warning" titleAccess="已代理" />
                ) : (
                  <CloudIcon color="disabled" titleAccess="仅 DNS" />
                )}
              </TableCell>
              <TableCell>{record.priority || '-'}</TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                      // TODO: 实现编辑功能
                      console.log('Edit', record.id);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(record.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
