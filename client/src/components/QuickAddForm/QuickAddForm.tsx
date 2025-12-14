import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  FormControlLabel,
  Switch,
  Collapse,
} from '@mui/material';
import { TTL_OPTIONS } from '@/utils/constants';
import { validateDNSContent } from '@/utils/validators';
import { useProvider } from '@/contexts/ProviderContext';
import { ProviderCapabilities, DnsLine } from '@/types/dns';

interface QuickAddFormProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  lines?: DnsLine[];
}

interface FormData {
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  priority?: number;
  weight?: number;
  line?: string;
  remark?: string;
}

/**
 * 快速添加 DNS 记录表单
 * 根据当前供应商能力动态显示字段
 */
export default function QuickAddForm({ onSubmit, loading, lines = [] }: QuickAddFormProps) {
  const { selectedProvider, currentCapabilities } = useProvider();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      type: 'A',
      name: '',
      content: '',
      ttl: 1,
      proxied: false,
      line: 'default',
    },
  });

  const recordType = watch('type');
  const showPriority = recordType === 'MX' || recordType === 'SRV';

  // 根据供应商能力决定显示哪些字段
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
  const showLine = caps.supportsLine && lines.length > 0;
  const showRemark = caps.supportsRemark;
  const recordTypes = caps.recordTypes;

  const handleFormSubmit = (data: FormData) => {
    // 只提交当前供应商支持的字段
    const submitData: Record<string, any> = {
      type: data.type,
      name: data.name,
      content: data.content,
      ttl: data.ttl,
    };

    if (showPriority && data.priority !== undefined) {
      submitData.priority = data.priority;
    }
    if (showProxied) {
      submitData.proxied = data.proxied;
    }
    if (showWeight && data.weight !== undefined) {
      submitData.weight = data.weight;
    }
    if (showLine && data.line) {
      submitData.line = data.line;
    }
    if (showRemark && data.remark) {
      submitData.remark = data.remark;
    }

    onSubmit(submitData);
    reset();
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* 记录类型 */}
        <TextField
          select
          label="类型"
          {...register('type', { required: true })}
          sx={{ minWidth: 120 }}
          size="small"
        >
          {recordTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>

        {/* 名称 */}
        <TextField
          label="名称"
          placeholder="@ 或 www"
          {...register('name', { required: '请输入名称' })}
          error={!!errors.name}
          helperText={errors.name?.message}
          sx={{ flex: 1, minWidth: 150 }}
          size="small"
        />

        {/* 内容 */}
        <TextField
          label="内容"
          placeholder="IP 地址或目标"
          {...register('content', {
            required: '请输入内容',
            validate: (value) => {
              const result = validateDNSContent(recordType, value);
              return result === null ? true : result;
            },
          })}
          error={!!errors.content}
          helperText={errors.content?.message}
          sx={{ flex: 1, minWidth: 150 }}
          size="small"
        />

        {/* TTL */}
        <TextField
          select
          label="TTL"
          {...register('ttl', { valueAsNumber: true })}
          sx={{ minWidth: 100 }}
          size="small"
        >
          {TTL_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        {/* 优先级 (MX/SRV) */}
        {showPriority && (
          <TextField
            type="number"
            label="优先级"
            {...register('priority', { valueAsNumber: true })}
            sx={{ width: 90 }}
            size="small"
          />
        )}

        {/* 权重 (DNSPod/华为云等) */}
        {showWeight && (
          <TextField
            type="number"
            label="权重"
            {...register('weight', { valueAsNumber: true })}
            sx={{ width: 90 }}
            size="small"
            placeholder="1-100"
          />
        )}

        {/* 线路 (阿里云/DNSPod等) */}
        {showLine && (
          <Controller
            name="line"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="线路"
                {...field}
                sx={{ minWidth: 120 }}
                size="small"
              >
                {lines.map((line) => (
                  <MenuItem key={line.code} value={line.code}>
                    {line.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        )}

        {/* Cloudflare 代理 */}
        {showProxied && (
          <FormControlLabel
            control={<Switch {...register('proxied')} size="small" />}
            label="代理"
            sx={{ mx: 1 }}
          />
        )}

        {/* 提交按钮 */}
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 80, height: 40 }}
        >
          {loading ? '添加中...' : '添加'}
        </Button>
      </Box>

      {/* 备注 (支持的供应商) */}
      <Collapse in={showRemark} unmountOnExit>
        <Box sx={{ mt: 2 }}>
          <TextField
            label="备注"
            placeholder="记录备注信息"
            {...register('remark')}
            fullWidth
            size="small"
          />
        </Box>
      </Collapse>
    </Box>
  );
}
