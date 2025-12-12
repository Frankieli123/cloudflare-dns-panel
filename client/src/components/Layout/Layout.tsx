import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  CloudQueue as CloudIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import { clearAuthData, getStoredUser } from '@/services/auth';

const drawerWidth = 260;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const user = getStoredUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    clearAuthData();
    navigate('/login');
  };

  const menuItems = [
    { text: '仪表盘', icon: <DashboardIcon />, path: '/' },
    { text: '操作日志', icon: <HistoryIcon />, path: '/logs' },
    { text: '系统设置', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 品牌区域 */}
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5,
        color: 'white'
      }}>
        <Avatar 
          sx={{ 
            bgcolor: theme.palette.secondary.main,
            width: 40,
            height: 40,
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
          }}
        >
          <CloudIcon />
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
            CF Panel
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            DNS 管理系统
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

      {/* 导航菜单 */}
      <List sx={{ px: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.text}
              selected={isSelected}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                mb: 1,
              }}
            >
              <ListItemIcon sx={{ 
                color: isSelected ? theme.palette.secondary.main : 'rgba(255,255,255,0.5)' 
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: '0.95rem'
                }} 
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* 底部用户信息 (仅侧边栏显示) */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.05)',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
          onClick={handleMenuOpen}
        >
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32,
              bgcolor: theme.palette.primary.light
            }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" color="white" noWrap fontWeight="medium">
              {user?.username}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.5)" noWrap>
              管理员
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      {/* 顶部导航栏 (移动端) */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          display: { sm: 'none' } // 桌面端隐藏顶部栏，保持干净
        }}
        elevation={0}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
            CF DNS 管理
          </Typography>
          <IconButton onClick={handleMenuOpen}>
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 桌面端右上角的用户菜单触发器 (悬浮) */}
      <Box
        sx={{
          position: 'fixed',
          top: 24,
          right: 32,
          zIndex: 1100,
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          gap: 2
        }}
      >
        <Button
          onClick={handleMenuOpen}
          endIcon={<ArrowDownIcon />}
          sx={{ 
            color: 'text.primary',
            bgcolor: 'background.paper',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            py: 1,
            px: 2,
            borderRadius: 50,
            '&:hover': { bgcolor: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
          }}
        >
          <Avatar 
            sx={{ 
              width: 28, 
              height: 28, 
              mr: 1, 
              fontSize: '0.875rem',
              bgcolor: theme.palette.secondary.main
            }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" fontWeight="medium">
            {user?.username}
          </Typography>
        </Button>
      </Box>

      {/* 用户下拉菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 200,
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">账户</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email || 'admin@example.com'}</Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          系统设置
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          退出登录
        </MenuItem>
      </Menu>

      {/* 侧边栏容器 */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* 主内容区域 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 4 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, sm: 0 }, // 移动端给AppBar留位置
        }}
      >
        <Toolbar sx={{ display: { sm: 'none' } }} /> {/* 占位符 */}
        <Outlet />
      </Box>
    </Box>
  );
}
