import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import moment from 'moment';

const NotificationList = ({ onClose }) => {
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    getNotificationIcon,
    getNotificationColor
  } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead([notification.id]);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'LIKE':
      case 'COMMENT':
      case 'SHARE':
        navigate(`/post/${notification.postId}`);
        break;
      case 'FRIEND_REQUEST':
        navigate(`/profile/${notification.actionUser.id}`);
        break;
      case 'MESSAGE':
        navigate(`/messages/${notification.actionUser.id}`);
        break;
      default:
        break;
    }

    if (onClose) {
      onClose();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        bgcolor: 'background.paper',
        zIndex: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6">Notifications</Typography>
        <Button 
          onClick={markAllAsRead}
          disabled={!notifications.some(n => !n.read)}
        >
          Mark all as read
        </Button>
      </Box>

      <List>
        {notifications.length === 0 ? (
          <ListItem>
            <ListItemText
              secondary="No notifications yet"
              sx={{ textAlign: 'center' }}
            />
          </ListItem>
        ) : (
          notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem
                button
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.selected'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={notification.actionUser?.photoURL}
                    sx={{
                      bgcolor: getNotificationColor(notification.type)
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                    >
                      {notification.message}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="span"
                    >
                      {moment(notification.timestamp).fromNow()}
                    </Typography>
                  }
                />
              </ListItem>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))
        )}
      </List>
    </Box>
  );
};

export default NotificationList;
