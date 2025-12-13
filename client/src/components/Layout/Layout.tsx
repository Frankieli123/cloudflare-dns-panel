import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import Sidebar from './Sidebar';

const drawerWidth = 260;
const appBarHeight = 64;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: '仪表盘', icon: <DashboardIcon />, path: '/' },
    { text: '操作日志', icon: <HistoryIcon />, path: '/logs' },
    { text: '系统设置', icon: <SettingsIcon />, path: '/settings' },
  ];

  // 确定当前选中的 tab
  const currentTab = menuItems.find(item => item.path === location.pathname)?.path || 
                     (location.pathname.startsWith('/domain') ? '/' : false) ||
                     (location.pathname.startsWith('/hostnames') ? '/' : false) || 
                     false;

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1e293b' }}>
      {/* Sidebar 内容 (包含顶部的 Logo 和下方的 DNS 提供商列表) */}
      <Sidebar onClose={() => isMobile && setMobileOpen(false)} />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      {/* 顶部导航栏 */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` }, // 桌面端宽度减去侧边栏宽度
          ml: { sm: `${drawerWidth}px` }, // 桌面端向右偏移侧边栏宽度
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          height: appBarHeight
        }}
        elevation={0}
      >
        <Toolbar sx={{ minHeight: appBarHeight }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* 桌面端顶部导航菜单 (Logo 已移至 Sidebar) */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' } }}>
            <Tabs 
              value={currentTab} 
              textColor="primary"
              indicatorColor="primary"
              sx={{ 
                minHeight: appBarHeight,
                '& .MuiTabs-indicator': { display: 'none' } // 移除下划线
              }}
            >
              {menuItems.map((item) => (
                <Tab 
                  key={item.path}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.icon}
                      {item.text}
                    </Box>
                  }
                  value={item.path}
                  onClick={() => navigate(item.path)}
                  sx={{ 
                    minHeight: appBarHeight, 
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    opacity: 0.7,
                    '&.Mui-selected': {
                      opacity: 1,
                      color: 'primary.main'
                    }
                  }}
                />
              ))}
            </Tabs>
          </Box>
        </Toolbar>
      </AppBar>

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
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: '#1e293b', // 确保深色背景
              borderRight: '1px solid rgba(255,255,255,0.1)'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: '#1e293b', // 确保深色背景
              borderRight: '1px solid rgba(255,255,255,0.1)',
              // mt: `${appBarHeight}px`, // REMOVED: 侧边栏现在占据全高
              height: '100%' // 确保全高
            },
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
          mt: `${appBarHeight}px`, // 避开 AppBar
          minHeight: `calc(100vh - ${appBarHeight}px)`,
          overflowX: 'hidden'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}