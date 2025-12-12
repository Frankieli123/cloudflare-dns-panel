import { useForm } from 'react-hook-form';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { DNS_RECORD_TYPES, TTL_OPTIONS } from '@/utils/constants';
import { validateDNSContent } from '@/utils/validators';

interface QuickAddFormProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
}

interface FormData {
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  priority?: number;
}

/**
 * 快速添加 DNS 记录表单
 */
export default function QuickAddForm({ onSubmit, loading }: QuickAddFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      type: 'A',
      name: '',
      content: '',
      ttl: 1,
      proxied: false,
    },
  });

  const recordType = watch('type');
  const showPriority = recordType === 'MX' || recordType === 'SRV';

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          select
          label="类型"
          {...register('type', { required: true })}
          sx={{ minWidth: 120 }}
        >
          {DNS_RECORD_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="名称"
          placeholder="@ 或 www"
          {...register('name', { required: '请输入名称' })}
          error={!!errors.name}
          helperText={errors.name?.message}
          sx={{ flex: 1, minWidth: 200 }}
        />

        <TextField
          label="内容"
          placeholder="IP 地址或目标"
          {...register('content', {
            required: '请输入内容',
            validate: (value) => validateDNSContent(recordType, value),
          })}
          error={!!errors.content}
          helperText={errors.content?.message}
          sx={{ flex: 1, minWidth: 200 }}
        />

        <TextField
          select
          label="TTL"
          {...register('ttl', { valueAsNumber: true })}
          sx={{ minWidth: 120 }}
        >
          {TTL_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        {showPriority && (
          <TextField
            type="number"
            label="优先级"
            {...register('priority', { valueAsNumber: true })}
            sx={{ minWidth: 100 }}
          />
        )}

        <FormControlLabel
          control={<Switch {...register('proxied')} />}
          label="代理"
        />

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {loading ? '添加中...' : '添加'}
        </Button>
      </Box>
    </Box>
  );
}
