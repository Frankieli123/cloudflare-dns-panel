import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { updatePassword, updateCfToken } from '@/services/auth';
import { isStrongPassword } from '@/utils/validators';

interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface TokenForm {
  cfApiToken: string;
}

/**
 * 设置页面
 */
export default function Settings() {
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [tokenSuccess, setTokenSuccess] = useState('');
  const [tokenError, setTokenError] = useState('');

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>();

  const {
    register: registerToken,
    handleSubmit: handleTokenSubmit,
    reset: resetToken,
    formState: { errors: tokenErrors },
  } = useForm<TokenForm>();

  const newPassword = watch('newPassword');

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      setPasswordError('');
      setPasswordSuccess('');

      await updatePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });

      setPasswordSuccess('密码修改成功');
      resetPassword();
    } catch (err: any) {
      setPasswordError(err || '密码修改失败');
    }
  };

  const onTokenSubmit = async (data: TokenForm) => {
    try {
      setTokenError('');
      setTokenSuccess('');

      await updateCfToken(data.cfApiToken);

      setTokenSuccess('API Token 更新成功');
      resetToken();
    } catch (err: any) {
      setTokenError(err || 'API Token 更新失败');
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        设置
      </Typography>

      {/* 修改密码 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          修改密码
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {passwordSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {passwordSuccess}
          </Alert>
        )}
        {passwordError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {passwordError}
          </Alert>
        )}

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
          <TextField
            fullWidth
            type="password"
            label="当前密码"
            margin="normal"
            {...registerPassword('oldPassword', { required: '请输入当前密码' })}
            error={!!passwordErrors.oldPassword}
            helperText={passwordErrors.oldPassword?.message}
          />

          <TextField
            fullWidth
            type="password"
            label="新密码"
            margin="normal"
            {...registerPassword('newPassword', {
              required: '请输入新密码',
              validate: (value) =>
                isStrongPassword(value) || '密码至少 8 位，包含大小写字母和数字',
            })}
            error={!!passwordErrors.newPassword}
            helperText={passwordErrors.newPassword?.message}
          />

          <TextField
            fullWidth
            type="password"
            label="确认新密码"
            margin="normal"
            {...registerPassword('confirmPassword', {
              required: '请确认新密码',
              validate: (value) => value === newPassword || '两次密码输入不一致',
            })}
            error={!!passwordErrors.confirmPassword}
            helperText={passwordErrors.confirmPassword?.message}
          />

          <Button type="submit" variant="contained" sx={{ mt: 2 }}>
            修改密码
          </Button>
        </form>
      </Paper>

      {/* 更新 API Token */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          更新 Cloudflare API Token
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {tokenSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {tokenSuccess}
          </Alert>
        )}
        {tokenError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {tokenError}
          </Alert>
        )}

        <form onSubmit={handleTokenSubmit(onTokenSubmit)}>
          <TextField
            fullWidth
            label="新的 API Token"
            margin="normal"
            {...registerToken('cfApiToken', { required: '请输入 API Token' })}
            error={!!tokenErrors.cfApiToken}
            helperText={tokenErrors.cfApiToken?.message || '在 Cloudflare 控制台获取新的 API Token'}
          />

          <Button type="submit" variant="contained" sx={{ mt: 2 }}>
            更新 Token
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
