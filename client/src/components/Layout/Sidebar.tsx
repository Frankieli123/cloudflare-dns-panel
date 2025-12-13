import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Avatar,
  Divider,
  useTheme,
  alpha,
  Skeleton,
  Tooltip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  CloudQueue as CloudflareIcon,
  Storage as AliyunIcon,
  Language as DnspodIcon,
  ExpandLess,
  ExpandMore,
  Dns as DnsIcon,
  Add as AddIcon,
  CloudQueue as CloudIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { useProvider } from '@/contexts/ProviderContext';
import { ProviderType } from '@/types/dns';
import { useNavigate } from 'react-router-dom';
import { clearAuthData, getStoredUser } from '@/services/auth';

const PROVIDER_CONFIG: Record<ProviderType, { icon: React.ReactNode; color: string; name: string }> = {
  cloudflare: {
    icon: <CloudflareIcon />,
    color: '#f38020',
    name: 'Cloudflare',
  },
  aliyun: {
    icon: <AliyunIcon />,
    color: '#ff6a00',
    name: '阿里云',
  },
  dnspod: {
    icon: <DnspodIcon />,
    color: '#0052d9',
    name: 'DNSPod',
  },
};

const PROVIDER_ORDER: ProviderType[] = ['cloudflare', 'aliyun', 'dnspod'];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = getStoredUser();
  const {
    providers,
    selectedProvider,
    selectProvider,
    getCredentialCountByProvider,
    isLoading,
  } = useProvider();

  // 状态用于控制哪些提供商的分组是展开的
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({
    cloudflare: true,
    aliyun: true,
    dnspod: true,
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    clearAuthData();
    navigate('/login');
  };

  const handleToggle = (type: string) => {
    setOpenStates((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSelectProvider = (type: ProviderType) => {
    selectProvider(type);
    navigate('/'); // 确保回到仪表盘查看该提供商的资源
    if (onClose) onClose();
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />
        ))}
      </Box>
    );
  }

  const sortedProviders = PROVIDER_ORDER
    .map(type => providers.find(p => p.type === type))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', color: 'white' }}>
      {/* 品牌 Logo 区域 */}
      <Box sx={{ 
        px: 3,
        py: 4,
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        color: 'white',
      }}>
        <Avatar 
          sx={{ 
            bgcolor: theme.palette.secondary.main,
            width: 44,
            height: 44,
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
          }}
          variant="circular"
        >
          <CloudIcon fontSize="medium" />
        </Avatar>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.1, letterSpacing: 0.5, color: 'white', fontSize: '1.1rem' }}>
            CF Panel
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.3, fontSize: '0.75rem' }}>
            DNS 管理系统
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 3, mb: 2 }} />

      {/* 侧边栏标题 */}
      <Box sx={{ px: 3, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>
          DNS 提供商
        </Typography>
        <Tooltip title="添加账号">
           <Box 
             onClick={() => navigate('/settings')}
             sx={{ 
               cursor: 'pointer', 
               color: 'rgba(255,255,255,0.4)', 
               '&:hover': { color: 'white' },
               display: 'flex',
               p: 0.5
             }}
           >
             <AddIcon fontSize="small" />
           </Box>
        </Tooltip>
      </Box>

      <List component="nav" sx={{ px: 2, flexGrow: 1, overflowY: 'auto' }}>
        {sortedProviders.map((provider) => {
          const config = PROVIDER_CONFIG[provider.type];
          const count = getCredentialCountByProvider(provider.type);
          const isSelected = selectedProvider === provider.type;
          const hasAccounts = count > 0;

          return (
            <Box key={provider.type} sx={{ mb: 1.5 }}>
              <ListItemButton
                onClick={() => hasAccounts ? handleSelectProvider(provider.type) : undefined}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                  bgcolor: isSelected ? alpha(config.color, 0.1) : 'rgba(255,255,255,0.02)',
                  border: '1px solid',
                  borderColor: isSelected ? alpha(config.color, 0.5) : 'transparent',
                  color: isSelected ? 'white' : 'rgba(255,255,255,0.7)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isSelected ? alpha(config.color, 0.15) : 'rgba(255,255,255,0.05)',
                    borderColor: isSelected ? config.color : 'rgba(255,255,255,0.1)',
                    transform: hasAccounts ? 'translateX(4px)' : 'none',
                  },
                  opacity: hasAccounts ? 1 : 0.6,
                  cursor: hasAccounts ? 'pointer' : 'default',
                }}
              >
                {/* 图标容器 - 还原彩色背景块 */}
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(config.color, 0.15),
                    color: config.color,
                    mr: 2,
                    '& svg': { fontSize: 20 },
                  }}
                >
                  {config.icon}
                </Box>

                <ListItemText 
                  primary={config.name} 
                  primaryTypographyProps={{ 
                    variant: 'body2', 
                    fontWeight: isSelected ? 600 : 500,
                    fontSize: '0.9rem'
                  }}
                  secondary={count > 0 ? `${count} 个账户` : '未配置'}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: isSelected ? alpha(config.color, 0.8) : 'rgba(255,255,255,0.4)',
                    sx: { mt: 0.2, display: 'block' }
                  }}
                />
              </ListItemButton>
            </Box>
          );
        })}
      </List>
      
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 0 }} />
      
      {/* 底部用户区域 */}
      <Box sx={{ p: 2 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.05)',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
          onClick={handleUserMenuOpen}
        >
          <Avatar 
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: theme.palette.primary.light,
              fontSize: '1rem'
            }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" color="white" noWrap fontWeight="bold">
              {user?.username}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.5)" noWrap>
              管理员
            </Typography>
          </Box>
          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}
          PaperProps={{
            sx: {
              mt: -1,
              ml: 1,
              width: 220,
              bgcolor: '#1e293b',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)'
            }
          }}
          transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
        >
          <MenuItem onClick={() => { handleUserMenuClose(); navigate('/settings'); }} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="系统设置" />
          </MenuItem>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <MenuItem onClick={handleLogout} sx={{ color: theme.palette.error.light, '&:hover': { bgcolor: 'rgba(255,50,50,0.1)' } }}>
            <ListItemIcon sx={{ color: theme.palette.error.light }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="退出登录" />
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
