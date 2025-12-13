import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Typography,
  Button,
  Grid,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stack,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Storage as StorageIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import {
  getDnsCredentials,
  createDnsCredential,
  updateDnsCredential,
  deleteDnsCredential,
  verifyDnsCredential,
  getProviders
} from '@/services/dnsCredentials';
import { DnsCredential, ProviderConfig, ProviderType } from '@/types/dns';
import ProviderSelector, { getProviderIcon } from './ProviderSelector';

interface CredentialFormInputs {
  name: string;
  provider: ProviderType;
  accountId?: string;
  secrets: Record<string, string>;
}

export default function DnsCredentialManagement() {
  const [credentials, setCredentials] = useState<DnsCredential[]>([]);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<DnsCredential | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<DnsCredential | null>(null);

  const [verifying, setVerifying] = useState<number | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ id: number; valid: boolean; message?: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CredentialFormInputs>({
    defaultValues: {
      provider: 'cloudflare',
      secrets: {}
    }
  });

  const selectedProviderType = watch('provider');
  const selectedProviderConfig = providers.find(p => p.type === selectedProviderType);

  // 加载数据
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [credsRes, provsRes] = await Promise.all([
        getDnsCredentials(),
        getProviders()
      ]);
      setCredentials(credsRes.data?.credentials || []);
      setProviders(provsRes.data?.providers || []);
    } catch (error) {
      console.error('加载数据失败', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 切换提供商时清空 secrets（防止提交旧提供商的字段）
  useEffect(() => {
    if (!dialogOpen || editingCredential) return;
    setValue('secrets', {});
    setValue('accountId', undefined);
  }, [dialogOpen, editingCredential, selectedProviderType, setValue]);

  // 打开新增对话框
  const handleOpenAdd = () => {
    setEditingCredential(null);
    setSubmitError(null);
    reset({ name: '', provider: 'cloudflare', secrets: {} });
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleOpenEdit = (cred: DnsCredential) => {
    setEditingCredential(cred);
    setSubmitError(null);
    reset({
      name: cred.name,
      provider: cred.provider,
      accountId: cred.accountId || '',
      secrets: {}
    });
    setDialogOpen(true);
  };

  // 关闭对话框
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCredential(null);
  };

  // 验证凭证
  const handleVerify = async (id: number) => {
    setVerifying(id);
    setVerifyResult(null);
    try {
      const res = await verifyDnsCredential(id);
      setVerifyResult({
        id,
        valid: res.data?.valid || false,
        message: res.data?.valid ? '凭证有效' : (res.data?.error || '凭证无效')
      });
    } catch (error: any) {
      setVerifyResult({ id, valid: false, message: error.message || '验证失败' });
    } finally {
      setVerifying(null);
    }
  };

  // 提交表单
  const onSubmit = async (data: CredentialFormInputs) => {
    try {
      setSubmitError(null);

      // 过滤空的 secrets
      const secretsToSubmit = { ...data.secrets };
      Object.keys(secretsToSubmit).forEach(key => {
        if (!secretsToSubmit[key]) delete secretsToSubmit[key];
      });

      if (editingCredential) {
        await updateDnsCredential(editingCredential.id, {
          name: data.name,
          accountId: data.accountId,
          secrets: Object.keys(secretsToSubmit).length > 0 ? secretsToSubmit : undefined
        });
      } else {
        await createDnsCredential({
          name: data.name,
          provider: data.provider,
          accountId: data.accountId,
          secrets: secretsToSubmit
        });
      }

      await loadData();
      handleCloseDialog();
    } catch (error: any) {
      setSubmitError(typeof error === 'string' ? error : (error.message || '操作失败'));
    }
  };

  // 设置默认
  const handleSetDefault = async (cred: DnsCredential) => {
    if (cred.isDefault) return;
    try {
      await updateDnsCredential(cred.id, { isDefault: true });
      await loadData();
    } catch (error) {
      console.error('设置默认失败', error);
    }
  };

  // 删除确认
  const handleDeleteConfirm = async () => {
    if (!credentialToDelete) return;
    try {
      await deleteDnsCredential(credentialToDelete.id);
      await loadData();
      setDeleteDialogOpen(false);
      setCredentialToDelete(null);
    } catch (error) {
      console.error('删除失败', error);
    }
  };

  return (
    <Card sx={{ height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}>
      <CardHeader
        avatar={<StorageIcon color="primary" />}
        title={<Typography variant="h6" fontWeight="bold">DNS 账户管理</Typography>}
        subheader="管理您的所有 DNS 服务商账户凭证"
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
          >
            新增账户
          </Button>
        }
      />
      <Divider />
      <CardContent>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : credentials.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">暂无账户，点击上方按钮添加</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {credentials.map((cred) => (
              <Grid item xs={12} key={cred.id}>
                <Card variant="outlined" sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  borderColor: cred.isDefault ? 'primary.main' : undefined,
                  bgcolor: cred.isDefault ? 'primary.50' : undefined
                }}>
                  <Box sx={{ mr: 2, color: 'text.secondary' }}>
                    {getProviderIcon(cred.provider, 'small')}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {cred.name}
                      </Typography>
                      {cred.isDefault && (
                        <Chip label="默认" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                      )}
                      <Chip
                        label={cred.providerName || cred.provider}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                      {verifyResult?.id === cred.id && (
                        <Chip
                          label={verifyResult.valid ? '有效' : '无效'}
                          size="small"
                          color={verifyResult.valid ? 'success' : 'error'}
                          icon={verifyResult.valid ? <CheckCircleIcon /> : undefined}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      ID: {cred.id} • 创建于 {cred.createdAt.substring(0, 10)}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Tooltip title="验证凭证">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleVerify(cred.id)}
                          disabled={verifying === cred.id}
                        >
                          {verifying === cred.id ? (
                            <CircularProgress size={18} />
                          ) : (
                            <CheckCircleIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="设为默认">
                      <span>
                        <IconButton
                          size="small"
                          color={cred.isDefault ? 'primary' : 'default'}
                          onClick={() => handleSetDefault(cred)}
                          disabled={cred.isDefault}
                        >
                          {cred.isDefault ? <StarIcon /> : <StarBorderIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="编辑">
                      <IconButton size="small" onClick={() => handleOpenEdit(cred)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="删除">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setCredentialToDelete(cred);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={credentials.length <= 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingCredential ? '编辑账户' : '新增账户'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3}>
              {submitError && (
                <Alert severity="error">{submitError}</Alert>
              )}

              <TextField
                label="账户别名"
                fullWidth
                placeholder="例如：个人域名、公司 DNS"
                {...register('name', { required: '请输入账户别名' })}
                error={!!errors.name}
                helperText={errors.name?.message}
              />

              {!editingCredential && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>选择服务商</Typography>
                  <ProviderSelector
                    providers={providers}
                    selectedProvider={selectedProviderType}
                    onSelect={(type) => setValue('provider', type)}
                  />
                </Box>
              )}

              {selectedProviderConfig && (
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    {selectedProviderConfig.name} 认证信息
                    {editingCredential && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (留空则不修改)
                      </Typography>
                    )}
                  </Typography>

                  <Stack spacing={2} mt={1}>
                    {selectedProviderType === 'cloudflare' && (
                      <TextField
                        label="Account ID (可选)"
                        fullWidth
                        size="small"
                        {...register('accountId')}
                        helperText="Cloudflare 某些功能需要 Account ID"
                      />
                    )}

                    {selectedProviderConfig.authFields.map((field) => (
                      <TextField
                        key={field.key}
                        label={field.label}
                        type={field.type}
                        fullWidth
                        size="small"
                        placeholder={field.placeholder}
                        {...register(`secrets.${field.key}`, {
                          required: editingCredential ? false : (field.required && '此项必填')
                        })}
                        error={!!errors.secrets?.[field.key]}
                        helperText={errors.secrets?.[field.key]?.message || field.helpText}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              <Alert severity="info" sx={{ mt: 1 }}>
                保存时将自动验证凭证有效性
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              取消
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : '保存'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除账户 <strong>{credentialToDelete?.name}</strong> 吗？
            <br />
            此操作不可恢复。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            取消
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
