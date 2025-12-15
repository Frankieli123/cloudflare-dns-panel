import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Table,
  TableContainer,
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
  ListSubheader,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cloud as CloudIcon,
  CloudQueue as CloudQueueIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  PowerSettingsNew as PowerIcon,
} from '@mui/icons-material';
import { DNSRecord } from '@/types';
import { DnsLine, ProviderCapabilities } from '@/types/dns';
import { formatTTL } from '@/utils/formatters';
import { TTL_OPTIONS } from '@/utils/constants';
import { useProvider } from '@/contexts/ProviderContext';

interface DNSRecordTableProps {
  records: DNSRecord[];
  onUpdate: (recordId: string, params: any) => void;
  onDelete: (recordId: string) => void;
  onStatusChange?: (recordId: string, enabled: boolean) => void;
  lines?: DnsLine[];
  minTTL?: number;
}

/**
 * DNS 记录表格组件
 * 根据供应商能力动态显示字段
 */
export default function DNSRecordTable({
  records,
  onUpdate,
  onDelete,
  onStatusChange,
  lines = [],
  minTTL,
}: DNSRecordTableProps) {
  const { selectedProvider, currentCapabilities } = useProvider();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DNSRecord>>({});
  const [hasOverflow, setHasOverflow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 检测是否有内容被遮挡
  const checkOverflow = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      const isOverflowing = el.scrollWidth > el.clientWidth;
      const isScrolledLeft = el.scrollLeft > 0;
      setHasOverflow(isOverflowing && (el.scrollLeft < el.scrollWidth - el.clientWidth));
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    checkOverflow();
    el.addEventListener('scroll', checkOverflow);
    window.addEventListener('resize', checkOverflow);
    return () => {
      el.removeEventListener('scroll', checkOverflow);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [checkOverflow, records]);

  const compactTextFieldSx = {
    '& .MuiInputBase-root': {
      height: 32,
      fontSize: '0.875rem',
    },
    '& .MuiInputBase-input': {
      paddingTop: 0,
      paddingBottom: 0,
    },
    '& .MuiSelect-select': {
      paddingTop: '6px',
      paddingBottom: '6px',
    },
  };

  // 固定操作列样式 - 只在有内容被遮挡时显示阴影
  const stickyActionCellSx = {
    position: 'sticky',
    right: 0,
    bgcolor: 'inherit',
    ...(hasOverflow && {
      boxShadow: '-4px 0 8px -4px rgba(0,0,0,0.15)',
    }),
    zIndex: 1,
  };

  // 根据供应商能力决定显示哪些列
  const caps: ProviderCapabilities = currentCapabilities || {
    supportsWeight: false,
    supportsLine: false,
    supportsStatus: false,
    supportsRemark: false,
    supportsUrlForward: false,
    supportsLogs: false,
    remarkMode: 'unsupported',
    paging: 'client',
    requiresDomainId: false,
    recordTypes: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'CAA', 'NS'],
  };

  const showProxied = selectedProvider === 'cloudflare';
  const showWeight = caps.supportsWeight;
  const showLine = caps.supportsLine;
  const showStatus = caps.supportsStatus && !!onStatusChange;
  const showRemark = caps.supportsRemark;
  const recordTypes = caps.recordTypes;

  const ttlOptions = TTL_OPTIONS.filter((o) => {
    if (selectedProvider !== 'cloudflare' && o.value === 1) return false;
    if (typeof minTTL === 'number' && Number.isFinite(minTTL) && minTTL > 0) {
      if (selectedProvider === 'cloudflare' && o.value === 1) return true;
      return o.value >= minTTL;
    }
    return true;
  });

  const safeTtlOptions = ttlOptions.length > 0
    ? ttlOptions
    : (typeof minTTL === 'number' && Number.isFinite(minTTL) && minTTL > 0
        ? [{ label: `${minTTL} 秒`, value: minTTL }]
        : TTL_OPTIONS.filter(o => (selectedProvider === 'cloudflare' ? true : o.value !== 1)));

  const hasLineCategories = lines.some(l => !!l.parentCode);
  const groupedLines = lines.reduce<Record<string, DnsLine[]>>((acc, line) => {
    const key = line.parentCode || '其他';
    if (!acc[key]) acc[key] = [];
    acc[key].push(line);
    return acc;
  }, {});

  // 计算动态列数
  const columnCount = 5 + (showProxied ? 1 : 0) + (showWeight ? 1 : 0) + (showLine ? 1 : 0) + (showStatus ? 1 : 0) + (showRemark ? 1 : 0);
  const minTableWidth = Math.max(650, columnCount * 110);

  const handleEditClick = (record: DNSRecord) => {
    setEditingId(record.id);
    setEditForm({
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl,
      proxied: record.proxied,
      priority: record.priority,
      weight: record.weight,
      line: record.line,
      remark: record.remark,
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

  const handleStatusToggle = (record: DNSRecord) => {
    if (onStatusChange) {
      onStatusChange(record.id, !record.enabled);
    }
  };

  const getLineName = (lineCode?: string) => {
    if (!lineCode) return '-';
    const line = lines.find(l => l.code === lineCode);
    return line?.name || lineCode;
  };

  const normalizeFqdn = (v?: string) => String(v || '').trim().replace(/\.+$/, '').toLowerCase();
  const visibleRecords = records.filter(r => {
    if (r.type !== 'NS') return true;
    const zone = normalizeFqdn(r.zoneName);
    if (!zone) return true;
    const name = normalizeFqdn(r.name);
    if (!name || name === '@') return false;
    return name !== zone;
  });

  return (
    <TableContainer ref={containerRef} sx={{ width: '100%', overflowX: 'auto', maxWidth: '100%' }}>
      <Table sx={{ minWidth: minTableWidth, '& .MuiTableCell-root': { whiteSpace: 'nowrap' } }}>
        <TableHead>
          <TableRow>
            <TableCell>类型</TableCell>
            <TableCell>名称</TableCell>
            <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>内容</TableCell>
            <TableCell>TTL</TableCell>
            {showProxied && <TableCell align="center">代理状态</TableCell>}
            <TableCell>优先级</TableCell>
            {showWeight && <TableCell>权重</TableCell>}
            {showLine && <TableCell>线路</TableCell>}
            {showRemark && <TableCell>备注</TableCell>}
            {showStatus && <TableCell align="center">状态</TableCell>}
            <TableCell align="right" sx={stickyActionCellSx}>操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRecords.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} align="center" sx={{ py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  暂无 DNS 记录
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            visibleRecords.map((record) => {
              const isEditing = editingId === record.id;

              if (isEditing) {
                const editingType =
                  typeof editForm.type === 'string' && recordTypes.includes(editForm.type)
                    ? editForm.type
                    : (recordTypes[0] ?? '');
                const firstAllowedTtl = safeTtlOptions[0]?.value ?? TTL_OPTIONS[0].value;
                const editingTtl =
                  typeof editForm.ttl === 'number' && safeTtlOptions.some(o => o.value === editForm.ttl)
                    ? editForm.ttl
                    : firstAllowedTtl;

                return (
                  <TableRow
                    key={record.id}
                    hover
                    sx={{
                      '& > .MuiTableCell-root': {
                        py: 0.5,
                        px: 1,
                      },
                    }}
                  >
                   <TableCell>
                    <TextField
                      select
                      size="small"
                      value={editingType}
                      onChange={(e) => handleChange('type', e.target.value)}
                      sx={{ width: 72, minWidth: 72, ...compactTextFieldSx }}
                    >
                      {recordTypes.map((type) => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </TextField>
                   </TableCell>
                   <TableCell>
                    <TextField
                      size="small"
                      value={editForm.name ?? ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      sx={compactTextFieldSx}
                    />
                   </TableCell>
                   <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <TextField
                      size="small"
                      fullWidth
                      value={editForm.content ?? ''}
                      onChange={(e) => handleChange('content', e.target.value)}
                      sx={compactTextFieldSx}
                    />
                   </TableCell>
                   <TableCell>
                    <TextField
                      select
                      size="small"
                      value={editingTtl}
                      onChange={(e) => handleChange('ttl', Number(e.target.value))}
                      sx={{ minWidth: 100, ...compactTextFieldSx }}
                    >
                      {safeTtlOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </TextField>
                   </TableCell>
                   {showProxied && (
                     <TableCell align="center">
                      <Switch
                        checked={!!editForm.proxied}
                        onChange={(e) => handleChange('proxied', e.target.checked)}
                      />
                     </TableCell>
                   )}
                   <TableCell>
                     {(editingType === 'MX' || editingType === 'SRV') && (
                       <TextField
                         type="number"
                         size="small"
                         value={editForm.priority ?? ''}
                         onChange={(e) => handleChange('priority', e.target.value === '' ? undefined : Number(e.target.value))}
                         sx={{ maxWidth: 80, ...compactTextFieldSx }}
                       />
                     )}
                   </TableCell>
                   {showWeight && (
                     <TableCell>
                       <TextField
                         type="number"
                         size="small"
                         value={editForm.weight ?? ''}
                         onChange={(e) => handleChange('weight', e.target.value ? Number(e.target.value) : undefined)}
                         sx={{ maxWidth: 80, ...compactTextFieldSx }}
                         placeholder="1-100"
                       />
                     </TableCell>
                   )}
                   {showLine && (
                     <TableCell>
                       <TextField
                         select
                         size="small"
                         value={editForm.line || 'default'}
                         onChange={(e) => handleChange('line', e.target.value)}
                         sx={{ minWidth: 100, ...compactTextFieldSx }}
                       >
                         {hasLineCategories
                           ? Object.keys(groupedLines)
                               .sort((a, b) => a.localeCompare(b, 'zh-CN'))
                               .flatMap((group) => [
                                 <ListSubheader key={`group-${group}`}>{group}</ListSubheader>,
                                 ...groupedLines[group]
                                   .slice()
                                   .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'))
                                   .map((line) => (
                                     <MenuItem key={`${group}-${line.code}`} value={line.code}>
                                       {line.name}
                                     </MenuItem>
                                   )),
                               ])
                           : lines.map((line) => (
                               <MenuItem key={line.code} value={line.code}>
                                 {line.name}
                               </MenuItem>
                             ))}
                       </TextField>
                     </TableCell>
                   )}
                   {showRemark && (
                     <TableCell>
                       <TextField
                         size="small"
                         value={editForm.remark || ''}
                         onChange={(e) => handleChange('remark', e.target.value)}
                         placeholder="备注"
                         sx={{ minWidth: 100, ...compactTextFieldSx }}
                       />
                     </TableCell>
                   )}
                   {showStatus && <TableCell />}
                   <TableCell align="right" sx={stickyActionCellSx}>
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
              <TableRow key={record.id} hover sx={{ opacity: record.enabled === false ? 0.5 : 1 }}>
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
                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Typography variant="body2" fontFamily="monospace" fontSize="0.85rem">
                    {record.content}
                  </Typography>
                </TableCell>
                <TableCell>{formatTTL(record.ttl)}</TableCell>
                {showProxied && (
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
                )}
                <TableCell>
                  {record.type === 'MX' || record.type === 'SRV' ? (record.priority ?? '-') : '-'}
                </TableCell>
                {showWeight && <TableCell>{record.weight ?? '-'}</TableCell>}
                {showLine && <TableCell>{record.lineName || getLineName(record.line)}</TableCell>}
                {showRemark && (
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>
                      {record.remark || '-'}
                    </Typography>
                  </TableCell>
                )}
                {showStatus && (
                  <TableCell align="center">
                    <Tooltip title={record.enabled !== false ? '点击禁用' : '点击启用'}>
                      <IconButton
                        size="small"
                        onClick={() => handleStatusToggle(record)}
                        color={record.enabled !== false ? 'success' : 'default'}
                      >
                        <PowerIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
                <TableCell align="right" sx={stickyActionCellSx}>
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
    </TableContainer>
  );
}
