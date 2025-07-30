import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Drawer, 
  IconButton, 
  Toolbar, 
  Typography, 
  Divider, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Avatar,
  Button
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  DirectionsCar as ConductoresIcon, 
  Receipt as SolicitudesIcon, 
  Logout as LogoutIcon,
  Person as ClientesIcon,
  Map as MapIcon,
  AttachMoney as ComisionesIcon,
  Schedule as ScheduledRidesIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import LanguageSwitcher from '../components/LanguageSwitcher';
import authService from '../services/authService';
import { useTokenValidation } from '../hooks/useTokenValidation';

const drawerWidth = 240;

const MainLayout = () => {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hook para validación automática de tokens
  useTokenValidation();

  // Obtener perfil del usuario desde el servidor
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => authService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Procesar información del usuario
  const userName = userProfile?.first_name || 'Usuario';
  const userRole = userProfile?.role ? t(`header.${userProfile.role}`) || userProfile.role : t('header.admin');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Asegurarse de que la biblioteca i18n está cargada
  const menuItems = [
    { text: t('menu.dashboard'), path: '/', icon: <DashboardIcon /> },
    { text: t('menu.requests'), path: '/solicitudes', icon: <SolicitudesIcon /> },
    { text: t('menu.drivers'), path: '/conductores', icon: <ConductoresIcon /> },
    { text: t('menu.clients'), path: '/clientes', icon: <ClientesIcon /> },
    { text: t('menu.scheduledRides'), path: '/scheduled-rides', icon: <ScheduledRidesIcon /> },
    { text: t('menu.zones'), path: '/zonas', icon: <MapIcon /> },
    { text: t('menu.commissions'), path: '/comisiones', icon: <ComisionesIcon /> },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', letterSpacing: '0.5px', color: '#333' }}>
          TAXI ROSA
        </Typography>
      </Box>
      <Divider />
      
      <List sx={{ flex: '1 1 auto', px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              selected={isActive(item.path)}
              onClick={() => handleNavigation(item.path)}
              sx={{ 
                borderRadius: 1,
                backgroundColor: isActive(item.path) ? '#f9e3ec' : 'transparent',
                '&.Mui-selected': {
                  backgroundColor: '#f9e3ec',
                },
                '&.Mui-selected:hover': {
                  backgroundColor: '#f9e3ec',
                },
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
                py: 0.8
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40, 
                color: isActive(item.path) ? '#e5308a' : 'text.secondary'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontSize: '0.9rem',
                  fontWeight: isActive(item.path) ? 'medium' : 'normal',
                  color: isActive(item.path) ? '#e5308a' : 'text.primary'
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Button
          onClick={handleLogout}
          variant="outlined"
          startIcon={<LogoutIcon />}
          fullWidth
          sx={{ 
            borderColor: '#e0e0e0',
            color: 'text.primary',
            textTransform: 'none',
            justifyContent: 'flex-start',
            py: 1
          }}
        >
          {t('auth.logout')}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <LanguageSwitcher />
            <Box sx={{ textAlign: 'right', mr: 1.5, ml: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {userName || 'Usuario'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {userRole || t('header.admin')}
              </Typography>
            </Box>
            <Avatar src="/avatar.jpg" alt={userName || 'Usuario'} />
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
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
      
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout; 