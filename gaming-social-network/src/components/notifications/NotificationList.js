import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import moment from 'moment';
import { db, auth } from '../../firebase/config';
import { doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';

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

    if (notification.type === 'FRIEND_REQUEST') return;

    switch (notification.type) {
      case 'LIKE':
      case 'COMMENT':
      case 'SHARE':
        navigate(`/post/${notification.postId}`);
        break;
      case 'MESSAGE':
        navigate(`/messages/${notification.actionUser.id}`);
        break;
      default:
        break;
    }

    if (onClose) onClose();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Filter duplicated request
  const uniqueFriendRequests = new Set();
  const filteredNotifications = notifications.filter(n => {
    if (n.type === 'FRIEND_REQUEST') {
      if (uniqueFriendRequests.has(n.actionUser?.id)) return false;
      uniqueFriendRequests.add(n.actionUser?.id);
    }
    return true;
  });

  const handleAcceptFriend = async (notification) => {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const senderRef = doc(db, 'users', notification.actionUser.id);

    await updateDoc(userRef, {
      friends: arrayUnion(notification.actionUser.id)
    });

    await updateDoc(senderRef, {
      friends: arrayUnion(auth.currentUser.uid)
    });

    await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', notification.id));
  };

  const handleRejectFriend = async (notification) => {
    await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', notification.id));
  };

  return (
    <Box sx={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
      <Box
        sx={{
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
        }}
      >
        <Typography variant="h6">Notifications</Typography>
        <Button onClick={markAllAsRead} disabled={!notifications.some(n => !n.read)}>
          Mark all as read
        </Button>
      </Box>

      <List>
        {filteredNotifications.length === 0 ? (
          <ListItem>
            <ListItemText secondary="No notifications yet" sx={{ textAlign: 'center' }} />
          </ListItem>
        ) : (
          filteredNotifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                  cursor: notification.type !== 'FRIEND_REQUEST' ? 'pointer' : 'default'
                }}
                onClick={() =>
                  notification.type !== 'FRIEND_REQUEST' &&
                  handleNotificationClick(notification)
                }
              >
                <ListItemAvatar>
                  <Avatar
                    src={notification.actionUser?.photoURL}
                    sx={{ bgcolor: getNotificationColor(notification.type) }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                      >
                        {notification.message}
                      </Typography>

                      {notification.type === 'FRIEND_REQUEST' && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={() => handleAcceptFriend(notification)}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={() => handleRejectFriend(notification)}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {moment(notification.timestamp).fromNow()}
                    </Typography>
                  }
                />
              </ListItem>
              {index < filteredNotifications.length - 1 && <Divider />}
            </React.Fragment>
          ))
        )}
      </List>
    </Box>
  );
};

export default NotificationList;