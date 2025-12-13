import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Alert,
  Divider,
  Grid,
  Stack,
  InputAdornment,
  IconButton
} from '@mui/material';
import { useForm } from 'react-hook-form';
import {
  Visibility,
  VisibilityOff,
  Security as SecurityIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { updatePassword } from '@/services/auth';
import { isStrongPassword } from '@/utils/validators';
import TokenManagement from '@/components/Settings/TokenManagement';

interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 设置页面
 */
export default function Settings() {
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordForm>();

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
      setPasswordError((err as any)?.message || String(err) || '密码修改失败');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          系统设置
        </Typography>
        <Typography variant="body1" color="text.secondary">
          管理您的账户安全和 Cloudflare 凭证
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 左侧：修改密码 */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}>
            <CardHeader
              avatar={<SecurityIcon color="primary" />}
              title={<Typography variant="h6" fontWeight="bold">安全设置</Typography>}
              subheader="修改您的登录密码"
            />
            <Divider />
            <CardContent>
              {passwordSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {passwordSuccess}
                </Alert>
              )}
              {passwordError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {passwordError}
                </Alert>
              )}

              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    type={showOldPassword ? 'text' : 'password'}
                    label="当前密码"
                    {...registerPassword('oldPassword', { required: '请输入当前密码' })}
                    error={!!passwordErrors.oldPassword}
                    helperText={passwordErrors.oldPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            edge="end"
                          >
                            {showOldPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    type={showNewPassword ? 'text' : 'password'}
                    label="新密码"
                    {...registerPassword('newPassword', {
                      required: '请输入新密码',
                      validate: (value) =>
                        isStrongPassword(value) || '密码至少 8 位，包含大小写字母和数字',
                    })}
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    type="password"
                    label="确认新密码"
                    {...registerPassword('confirmPassword', {
                      required: '请确认新密码',
                      validate: (value) => value === newPassword || '两次密码输入不一致',
                    })}
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword?.message}
                  />

                  <Box sx={{ pt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={isPasswordSubmitting}
                    >
                      修改密码
                    </Button>
                  </Box>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* 右侧：多账户 Token 管理 */}
        <Grid item xs={12} md={7}>
          <TokenManagement />
        </Grid>
      </Grid>
    </Box>
  );
}
