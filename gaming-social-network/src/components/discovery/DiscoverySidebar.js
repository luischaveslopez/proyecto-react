import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  orderBy, 
  doc, 
  getDoc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Skeleton,
  IconButton,
  Tooltip,
  useTheme,
  Snackbar,
  Alert
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  VideogameAsset as GameIcon,
  Whatshot as TrendingIcon,
  EmojiEvents as AchievementIcon
} from '@mui/icons-material';
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
import ImportantDevicesIcon from '@mui/icons-material/ImportantDevices';

const DiscoverySidebar = () => {
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [popularGames, setPopularGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const theme = useTheme();
  const currentUser = auth.currentUser;

  const fetchSuggestedFriends = async () => {
    if (!currentUser) return;

    try {
      // Get current user's data
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();
      const userInterests = userData?.interests || [];
      const userFriends = userData?.friends || [];

      // Query users with similar interests who aren't already friends
      const usersQuery = query(
        collection(db, 'users'),
        where('interests', 'array-contains-any', userInterests.length ? userInterests : ['gaming']),
        where('uid', 'not-in', [...userFriends, currentUser.uid]),
        limit(5)
      );

      const usersSnapshot = await getDocs(usersQuery);
      setSuggestedFriends(
        usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    } catch (error) {
      console.error('Error fetching suggested friends:', error);
      setSnackbar({
        open: true,
        message: 'Error loading friend suggestions',
        severity: 'error'
      });
    }
  };

  const fetchTrendingPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('likes', 'desc'),
        limit(3)
      );

      const postsSnapshot = await getDocs(postsQuery);
      setTrendingPosts(
        postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    } catch (error) {
      console.error('Error fetching trending posts:', error);
    }
  };

  const fetchPopularGames = async () => {
    try {
      const gamesQuery = query(
        collection(db, 'games'),
        orderBy('players', 'desc'),
        limit(5)
      );

      const gamesSnapshot = await getDocs(gamesQuery);
      setPopularGames(
        gamesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    } catch (error) {
      console.error('Error fetching popular games:', error);
    }
  };

  const refreshSuggestions = () => {
    setLoading(true);
    Promise.all([
      fetchSuggestedFriends(),
      fetchTrendingPosts(),
      fetchPopularGames()
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshSuggestions();
  }, [currentUser]);

  const handleAddFriend = async (userId) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const friendRef = doc(db, 'users', userId);

      // Add to current user's friends list
      await updateDoc(userRef, {
        friends: arrayUnion(userId)
      });

      // Add to friend's friends list
      await updateDoc(friendRef, {
        friends: arrayUnion(currentUser.uid)
      });

      setSnackbar({
        open: true,
        message: 'Friend request sent successfully!',
        severity: 'success'
      });

      // Refresh suggestions
      refreshSuggestions();
    } catch (error) {
      console.error('Error adding friend:', error);
      setSnackbar({
        open: true,
        message: 'Error sending friend request',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 360 }}>
      {/* Suggested Friends */}
      <Card 
        sx={{ 
          mb: 2,
          borderRadius: 2,
          boxShadow: theme.shadows[2]
        }}
      >
        <CardHeader
          title={
            <Box display="flex" alignItems="center">
              <SupervisedUserCircleIcon sx={{ mr: 1, color: 'primary.main' }} />
              Suggested Friends
            </Box>
          }
          action={
            <Tooltip title="Refresh suggestions">
              <IconButton onClick={refreshSuggestions} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          }
          sx={{
            pb: 1,
            '& .MuiCardHeader-title': {
              fontSize: '1rem',
              fontWeight: 600
            }
          }}
        />
        <List dense>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <ListItem key={i}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton width="60%" />}
                  secondary={<Skeleton width="40%" />}
                />
              </ListItem>
            ))
          ) : (
            suggestedFriends.map(friend => (
              <ListItem key={friend.id}>
                <ListItemAvatar>
                  <Avatar src={friend.photoURL}>
                    {friend.username?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={friend.username}
                  secondary={`${friend.mutualFriends || 0} mutual friends`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleAddFriend(friend.id)}
                    color="primary"
                    size="small"
                  >
                    <PersonAddIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
          {!loading && suggestedFriends.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No suggestions available"
                secondary="Try adding some interests to your profile"
                sx={{ textAlign: 'center' }}
              />
            </ListItem>
          )}
        </List>
      </Card>

      {/* Trending Posts */}
      <Card 
        sx={{ 
          mb: 2,
          borderRadius: 2,
          boxShadow: theme.shadows[2]
        }}
      >
        <CardHeader
          title="Trending Posts"
          avatar={<TrendingIcon color="primary" />}
          sx={{
            pb: 1,
            '& .MuiCardHeader-title': {
              fontSize: '1rem',
              fontWeight: 600
            }
          }}
        />
        <CardContent sx={{ pt: 0 }}>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Box key={i} sx={{ mb: 2 }}>
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="60%" />
              </Box>
            ))
          ) : (
            trendingPosts.map(post => (
              <Box key={post.id} sx={{ mb: 2 }}>
                <Typography variant="body2" noWrap>
                  {post.content}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {post.likes?.length || 0} likes • {post.comments?.length || 0} comments
                </Typography>
              </Box>
            ))
          )}
          {!loading && trendingPosts.length === 0 && (
            <Typography variant="body2" color="text.secondary" align="center">
              No trending posts yet
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Popular Games */}
      <Card 
        sx={{ 
          borderRadius: 2,
          boxShadow: theme.shadows[2]
        }}
      >
        <CardHeader
          title="Popular Games"
          avatar={<ImportantDevicesIcon color="primary" />}
          sx={{
            pb: 1,
            '& .MuiCardHeader-title': {
              fontSize: '1rem',
              fontWeight: 600
            }
          }}
        />
        <List dense>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <ListItem key={i}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton width="60%" />}
                  secondary={<Skeleton width="40%" />}
                />
              </ListItem>
            ))
          ) : (
            popularGames.map(game => (
              <ListItem key={game.id}>
                <ListItemAvatar>
                  <Avatar src={game.imageUrl}>
                    <GameIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={game.name}
                  secondary={`${game.players} active players`}
                />
                {game.trending && (
                  <AchievementIcon color="primary" fontSize="small" />
                )}
              </ListItem>
            ))
          )}
          {!loading && popularGames.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No games available"
                secondary="Check back later for updates"
                sx={{ textAlign: 'center' }}
              />
            </ListItem>
          )}
        </List>
      </Card>

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
    </Box>
  );
};

export default DiscoverySidebar;
