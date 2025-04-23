import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  orderBy,
  limit,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Badge,
  Chip,
  Menu,
  MenuItem,
  CircularProgress,
  useTheme,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Settings as SettingsIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Block as BlockIcon,
  Flag as FlagIcon,
  GridOn as GridIcon,
  Bookmark as BookmarkIcon,
  Favorite as FavoriteIcon,
  SportsEsports as GamingIcon,
  Message as MessageIcon,
  MoreVert as MoreVertIcon,
  Public as PublicIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import PostList from '../posts/PostList';
import CreatePost from '../posts/CreatePost';
import FriendsList from './FriendsList';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const currentUser = auth.currentUser;
  
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [friendsDialog, setFriendsDialog] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [reportDialog, setReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const isOwnProfile = currentUser?.uid === userId;

  useEffect(() => {
    fetchProfileData();
    fetchPosts();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setProfileData({ id: userDoc.id, ...userDoc.data() });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      showSnackbar('Error loading profile', 'error');
    }
  };

  const fetchPosts = async () => {
    try {
      // Fetch user's posts
      const postsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', userId)
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      const postsList = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      postsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setPosts(postsList);


      if (isOwnProfile) {
        // Fetch saved posts
        const savedPostsQuery = query(
          collection(db, 'posts'),
          where('savedBy', 'array-contains', userId)
        );
        const savedSnapshot = await getDocs(savedPostsQuery);
        setSavedPosts(savedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch liked posts
        const likedPostsQuery = query(
          collection(db, 'posts'),
          where('likes', 'array-contains', userId)
        );
        const likedSnapshot = await getDocs(likedPostsQuery);
        setLikedPosts(likedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      showSnackbar('Error loading posts', 'error');
    }
  };

  const handleAddFriend = async () => {
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

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        userId: userId,
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
      fetchProfileData();
    } catch (error) {
      console.error('Error adding friend:', error);
      showSnackbar('Error sending friend request', 'error');
    }
  };

  const handleRemoveFriend = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const friendRef = doc(db, 'users', userId);

      await updateDoc(userRef, {
        friends: arrayRemove(userId)
      });

      await updateDoc(friendRef, {
        friends: arrayRemove(currentUser.uid)
      });

      showSnackbar('Friend removed successfully', 'success');
      fetchProfileData();
    } catch (error) {
      console.error('Error removing friend:', error);
      showSnackbar('Error removing friend', 'error');
    }
  };

  const handleBlockUser = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        blockedUsers: arrayUnion(userId)
      });

      showSnackbar('User blocked successfully', 'success');
      setMenuAnchorEl(null);
      navigate('/');
    } catch (error) {
      console.error('Error blocking user:', error);
      showSnackbar('Error blocking user', 'error');
    }
  };

  const handleReport = async () => {
    try {
      await addDoc(collection(db, 'reports'), {
        reportedUserId: userId,
        reporterId: currentUser.uid,
        reason: reportReason,
        timestamp: serverTimestamp(),
        status: 'pending'
      });

      setReportDialog(false);
      showSnackbar('User reported successfully', 'success');
    } catch (error) {
      console.error('Error reporting user:', error);
      showSnackbar('Error reporting user', 'error');
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
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Alert severity="error">User not found</Alert>
      </Container>
    );
  }

  const isFriend = profileData.friends?.includes(currentUser?.uid);
  const isBlocked = profileData.blockedUsers?.includes(currentUser?.uid);

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
      {/* Profile Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                isOwnProfile && (
                  <IconButton
                    onClick={() => navigate('/settings')}
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      '&:hover': { bgcolor: theme.palette.primary.dark }
                    }}
                  >
                    <EditIcon sx={{ color: 'white', fontSize: 20 }} />
                  </IconButton>
                )
              }
            >
              <Avatar
                src={profileData.photoURL}
                sx={{ 
                  width: 150, 
                  height: 150,
                  border: `4px solid ${theme.palette.primary.main}`
                }}
              >
                {profileData.username?.[0]}
              </Avatar>
            </Badge>
          </Grid>

          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ mr: 2 }}>
                {profileData.username}
              </Typography>
              {profileData.isAdmin && (
                <Chip 
                  icon={<GamingIcon />} 
                  label="Admin" 
                  color="primary" 
                  size="small" 
                  sx={{ mr: 1 }}
                />
              )}
              {profileData.privacySettings?.profileVisibility === 'private' && (
                <Tooltip title="Private Profile">
                  <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </Tooltip>
              )}
              {!isOwnProfile && (
                <Box sx={{ ml: 'auto' }}>
                  <Button
                    variant="contained"
                    startIcon={isFriend ? <PersonRemoveIcon /> : <PersonAddIcon />}
                    onClick={isFriend ? handleRemoveFriend : handleAddFriend}
                    sx={{ mr: 1 }}
                  >
                    {isFriend ? 'Remove Friend' : 'Add Friend'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<MessageIcon />}
                    onClick={() => navigate(`/messages/${userId}`)}
                  >
                    Message
                  </Button>
                  <IconButton onClick={(e) => setMenuAnchorEl(e.currentTarget)}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" paragraph>
                {profileData.bio || 'No bio added yet'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setFriendsDialog(true)}
                >
                  <strong>{profileData.friends?.length || 0}</strong> friends
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>{posts.length}</strong> posts
                </Typography>
                {profileData.gamesPlayed?.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>{profileData.gamesPlayed.length}</strong> games played
                  </Typography>
                )}
              </Box>
            </Box>

            {profileData.gamesPlayed?.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {profileData.gamesPlayed.map((game, index) => (
                  <Chip
                    key={index}
                    icon={<GamingIcon />}
                    label={game}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Content Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<GridIcon />} label="Posts" />
          {isOwnProfile && <Tab icon={<BookmarkIcon />} label="Saved" />}
          {isOwnProfile && <Tab icon={<FavoriteIcon />} label="Liked" />}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {currentTab === 0 && (
            <>
              {isOwnProfile && <CreatePost onPostCreated={fetchPosts} />}
              <PostList posts={posts} onPostUpdate={fetchPosts} />
            </>
          )}
          {currentTab === 1 && isOwnProfile && (
            <PostList posts={savedPosts} onPostUpdate={fetchPosts} />
          )}
          {currentTab === 2 && isOwnProfile && (
            <PostList posts={likedPosts} onPostUpdate={fetchPosts} />
          )}
        </Box>
      </Paper>

      {/* Friends Dialog */}
      <Dialog
        open={friendsDialog}
        onClose={() => setFriendsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Friends</DialogTitle>
        <DialogContent>
          <FriendsList userId={userId} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFriendsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* More Options Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
      >
        <MenuItem onClick={handleBlockUser}>
          <BlockIcon sx={{ mr: 1 }} /> Block User
        </MenuItem>
        <MenuItem onClick={() => {
          setMenuAnchorEl(null);
          setReportDialog(true);
        }}>
          <FlagIcon sx={{ mr: 1 }} /> Report User
        </MenuItem>
      </Menu>

      {/* Report Dialog */}
      <Dialog
        open={reportDialog}
        onClose={() => setReportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report User</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Please select a reason for reporting this user:
          </Typography>
          <List>
            {[
              'Inappropriate content',
              'Harassment or bullying',
              'Spam or scam',
              'Fake account',
              'Other'
            ].map((reason) => (
              <ListItem
                key={reason}
                button
                selected={reportReason === reason}
                onClick={() => setReportReason(reason)}
              >
                <ListItemText primary={reason} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>Cancel</Button>
          <Button
            onClick={handleReport}
            color="error"
            variant="contained"
            disabled={!reportReason}
          >
            Report User
          </Button>
        </DialogActions>
      </Dialog>

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
    </Container>
  );
};

export default Profile;
