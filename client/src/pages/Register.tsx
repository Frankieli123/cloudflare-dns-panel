import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { register as registerUser } from '@/services/auth';
import { isValidEmail, isStrongPassword } from '@/utils/validators';

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  cfApiToken: string;
  cfAccountId?: string;
}

/**
 * 注册页面
 */
export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      setError('');

      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        cfApiToken: data.cfApiToken,
        cfAccountId: data.cfAccountId,
      });

      alert('注册成功！请登录');
      navigate('/login');
    } catch (err: any) {
      setError(err || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            注册账户
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            创建您的 Cloudflare DNS 管理账户
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="用户名"
              margin="normal"
              {...register('username', {
                required: '请输入用户名',
                minLength: { value: 3, message: '用户名至少 3 个字符' },
              })}
              error={!!errors.username}
              helperText={errors.username?.message}
            />

            <TextField
              fullWidth
              label="邮箱"
              type="email"
              margin="normal"
              {...register('email', {
                required: '请输入邮箱',
                validate: (value) => isValidEmail(value) || '请输入有效的邮箱地址',
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <TextField
              fullWidth
              type="password"
              label="密码"
              margin="normal"
              {...register('password', {
                required: '请输入密码',
                validate: (value) =>
                  isStrongPassword(value) || '密码至少 8 位，包含大小写字母和数字',
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <TextField
              fullWidth
              type="password"
              label="确认密码"
              margin="normal"
              {...register('confirmPassword', {
                required: '请确认密码',
                validate: (value) => value === password || '两次密码输入不一致',
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />

            <TextField
              fullWidth
              label="Cloudflare API Token"
              margin="normal"
              {...register('cfApiToken', { required: '请输入 Cloudflare API Token' })}
              error={!!errors.cfApiToken}
              helperText={errors.cfApiToken?.message || '在 Cloudflare 控制台获取 API Token'}
            />

            <TextField
              fullWidth
              label="Cloudflare Account ID（可选）"
              margin="normal"
              {...register('cfAccountId')}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? '注册中...' : '注册'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                已有账户？{' '}
                <Link component={RouterLink} to="/login">
                  立即登录
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
