import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/config';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Button,
  Tooltip,
  useTheme,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Message as MessageIcon,
  SportsEsports as GamingIcon,
  Public as PublicIcon,
  Lock as LockIcon
} from '@mui/icons-material';

const FriendsList = ({ userId }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const theme = useTheme();
  const currentUser = auth.currentUser;

  useEffect(() => {
    fetchFriends();
  }, [userId]);

  const fetchFriends = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const friendIds = userDoc.data()?.friends || [];

      const friendsData = await Promise.all(
        friendIds.map(async (friendId) => {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          
          // Calculate mutual friends
          const mutualFriends = friendDoc.data()?.friends?.filter(id => 
            userDoc.data()?.friends?.includes(id)
          )?.length || 0;

          return { 
            id: friendId, 
            ...friendDoc.data(),
            mutualFriends
          };
        })
      );

      setFriends(friendsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching friends:', error);
      showSnackbar('Error loading friends', 'error');
      setLoading(false);
    }
  };

  const handleAddFriend = async (friendId) => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const friendRef = doc(db, 'users', friendId);

      await Promise.all([
        updateDoc(userRef, {
          friends: arrayUnion(friendId)
        }),
        updateDoc(friendRef, {
          friends: arrayUnion(currentUser.uid)
        })
      ]);

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        userId: friendId,
        type: 'friendRequest',
        fromUser: {
          id: currentUser.uid,
          username: currentUser.displayName,
          photoURL: currentUser.photoURL
        },
        timestamp: serverTimestamp(),
        read: false
      });

      showSnackbar('Friend request sent successfully', 'success');
      fetchFriends();
    } catch (error) {
      console.error('Error adding friend:', error);
      showSnackbar('Error sending friend request', 'error');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const friendRef = doc(db, 'users', friendId);

      await Promise.all([
        updateDoc(userRef, {
          friends: arrayRemove(friendId)
        }),
        updateDoc(friendRef, {
          friends: arrayRemove(currentUser.uid)
        })
      ]);

      showSnackbar('Friend removed successfully', 'success');
      fetchFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
      showSnackbar('Error removing friend', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (friends.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          No friends yet
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <List>
        {friends.map((friend) => {
          const isFriend = friend.friends?.includes(currentUser?.uid);
          const isCurrentUser = friend.id === currentUser?.uid;

          return (
            <ListItem
              key={friend.id}
              sx={{
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <ListItemAvatar>
                <Avatar
                  src={friend.photoURL}
                  sx={{ 
                    cursor: 'pointer',
                    width: 50,
                    height: 50,
                    border: `2px solid ${theme.palette.primary.main}`
                  }}
                  onClick={() => navigate(`/profile/${friend.id}`)}
                >
                  {friend.username?.[0]}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { color: theme.palette.primary.main }
                      }}
                      onClick={() => navigate(`/profile/${friend.id}`)}
                    >
                      {friend.username}
                    </Typography>
                    {friend.isAdmin && (
                      <Chip
                        icon={<GamingIcon />}
                        label="Admin"
                        color="primary"
                        size="small"
                      />
                    )}
                    {friend.privacySettings?.profileVisibility === 'private' && (
                      <Tooltip title="Private Profile">
                        <LockIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                      </Tooltip>
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {friend.gamesPlayed?.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        {friend.gamesPlayed.length} games played
                      </Typography>
                    )}
                    {friend.mutualFriends > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        • {friend.mutualFriends} mutual friends
                      </Typography>
                    )}
                  </Box>
                }
              />
              {!isCurrentUser && (
                <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Send Message">
                    <IconButton
                      edge="end"
                      onClick={() => navigate(`/messages/${friend.id}`)}
                    >
                      <MessageIcon />
                    </IconButton>
                  </Tooltip>
                  {!isFriend ? (
                    <Tooltip title="Add Friend">
                      <IconButton
                        edge="end"
                        onClick={() => handleAddFriend(friend.id)}
                        color="primary"
                      >
                        <PersonAddIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Remove Friend">
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveFriend(friend.id)}
                        color="error"
                      >
                        <PersonRemoveIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItemSecondaryAction>
              )}
            </ListItem>
          );
        })}
      </List>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FriendsList;
