import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Popover,
  Box,
  Container,
  useTheme,
  useMediaQuery,
  Divider,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  SportsEsports as GamingIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationList from '../notifications/NotificationList';
import SearchBar from '../search/SearchBar';
import { doc, getDoc } from 'firebase/firestore';
import HandymanIcon from '@mui/icons-material/Handyman';

const Navigation = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { unreadCount } = useNotifications();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const currentUser = auth.currentUser;

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        setIsAdmin(userDoc.data()?.isAdmin || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();

    // Cleanup function to clear anchor elements when component unmounts
    return () => {
      setAnchorEl(null);
      setNotificationAnchorEl(null);
    };
  }, [currentUser]);

  const handleMenu = (event) => {
    if (event.currentTarget) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    if (event.currentTarget) {
      setNotificationAnchorEl(event.currentTarget);
    }
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      handleClose(); // Close menu before logout
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfile = () => {
    handleClose(); // Close menu before navigation
    navigate(`/profile/${currentUser.uid}`);
  };

  const handleSettings = () => {
    handleClose(); // Close menu before navigation
    navigate('/settings');
  };

  const handleAdmin = () => {
    handleClose(); // Close menu before navigation
    navigate('/admin');
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    document.body.style.backgroundColor = newTheme === 'dark' ? '#18191c' : '#ffffff';
    setIsDarkMode(!isDarkMode);
  };

  // Check if menu should be open - only if anchorEl exists and is in the document
  const isMenuOpen = Boolean(anchorEl) && document.contains(anchorEl);
  const isNotificationOpen = Boolean(notificationAnchorEl) && document.contains(notificationAnchorEl);

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        bgcolor: 'background.paper',
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none'
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1, sm: 2 } }}>
          {/* Logo and Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GamingIcon 
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                mr: 1,
                color: theme.palette.primary.main,
                fontSize: 32
              }} 
            />
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'text.primary',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Gaming Social
            </Typography>
          </Box>

          {/* Search Bar - Hidden on mobile */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, mx: 2, maxWidth: 600 }}>
              <SearchBar />
            </Box>
          )}

          {/* Navigation Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {currentUser ? (
              <> 
                {isAdmin && (
                  <Tooltip title="Admin Dashboard">
                    <IconButton
                      color="primary"
                      onClick={handleAdmin}
                      sx={{ 
                        bgcolor: theme.palette.action.hover,
                        '&:hover': {
                          bgcolor: theme.palette.action.selected
                        }
                      }}
                    >
                      <AdminIcon />
                    </IconButton>
                  </Tooltip>
                )}

                <IconButton
                  color="primary"
                  onClick={handleNotificationClick}
                  sx={{ 
                    bgcolor: theme.palette.action.hover,
                    '&:hover': {
                      bgcolor: theme.palette.action.selected
                    }
                  }}
                >
                  <Badge 
                    badgeContent={unreadCount} 
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: theme.palette.error.main,
                        color: 'white'
                      }
                    }}
                  >
                    <NotificationsIcon />
                  </Badge>
                </IconButton>

                <IconButton
                  onClick={handleMenu}
                  sx={{ 
                    p: 0.5,
                    border: `2px solid ${theme.palette.primary.main}`,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover
                    }
                  }}
                >
                  <Avatar
                    src={currentUser.photoURL}
                    sx={{ width: 32, height: 32 }}
                  >
                    {currentUser.displayName?.[0] || currentUser.email?.[0]}
                  </Avatar>
                </IconButton>

                {anchorEl && (
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    open={isMenuOpen}
                    onClose={handleClose}
                    onClick={handleClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    PaperProps={{
                      sx: {
                        mt: 1.5,
                        borderRadius: 2,
                        minWidth: 200
                      }
                    }}
                  >
                    <MenuItem onClick={handleProfile}>
                      <ListItemIcon>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      Profile
                    </MenuItem>
                    <MenuItem onClick={handleSettings}>
                      <ListItemIcon>
                      <HandymanIcon fontSize="small" />
                      </ListItemIcon>
                      Settings
                    </MenuItem>
                    {isAdmin && (
                      <MenuItem onClick={handleAdmin}>
                        <ListItemIcon>
                          <AdminIcon fontSize="small" />
                        </ListItemIcon>
                        Admin Dashboard
                      </MenuItem>
                    )}
                    <Divider />
                    <MenuItem 
                      onClick={handleLogout}
                      sx={{ color: theme.palette.error.main }}
                    >
                      <ListItemIcon>
                        <LogoutIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      Logout
                    </MenuItem>
                  </Menu>
                )}

                {notificationAnchorEl && (
                  <Popover
                    open={isNotificationOpen}
                    anchorEl={notificationAnchorEl}
                    onClose={handleNotificationClose}
                    onClick={handleNotificationClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    PaperProps={{
                      sx: {
                        mt: 1.5,
                        width: 360,
                        maxWidth: '100%',
                        borderRadius: 2
                      }
                    }}
                  >
                    <NotificationList onClose={handleNotificationClose} />
                  </Popover>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  component={RouterLink}
                  to="/login"
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  component={RouterLink}
                  to="/register"
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  Register
                </Button>
              </>
            )}
            {/* Theme toggle button */}
            <Button
              onClick={toggleTheme}
              variant="outlined"
              sx={{ ml: 2 }}
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </Box>
        </Toolbar>
      </Container>

      {/* Mobile Search Bar */}
      {isMobile && currentUser && (
        <Box sx={{ px: 2, pb: 2 }}>
          <SearchBar />
        </Box>
      )}
    </AppBar>
  );
};

export default Navigation;
