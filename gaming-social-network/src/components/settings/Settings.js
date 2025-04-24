import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../../firebase/config';
import { 
  updatePassword, 
  deleteUser, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  updateProfile 
} from 'firebase/auth';
import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Divider,
  useTheme,
  Badge,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Lock as LockIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  PhotoCamera as CameraIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Save as SaveIcon,
  PersonOff as PersonOffIcon,
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { useNavigate } from 'react-router-dom';

const uploadImageToImgbb = async (file) => {
  const apiKey = 'c219f99abffb6810a5c657dfc480d1f5'; // API de imgbb
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error('Error al subir la imagen');
  }

  return data.data.url; 
};

const Settings = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    postsVisibility: 'public',
    friendsListVisibility: 'public',
    showOnlineStatus: true,
    allowFriendRequests: true,
    allowMessages: true
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    friendRequests: true,
    messages: true,
    postLikes: true,
    comments: true,
    mentions: true
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [confirmDeletePassword, setConfirmDeletePassword] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const theme = useTheme();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const data = userDoc.data();
      setUserData(data);
      setUsername(data.username || '');
      setBio(data.bio || '');
      setPrivacySettings(data.privacySettings || privacySettings);
      setNotificationSettings(data.notificationSettings || notificationSettings);
      await fetchBlockedUsers(data.blockedUsers || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      showSnackbar('Error loading user data', 'error');
    }
  };

  const fetchBlockedUsers = async (blockedIds) => {
    try {
      const blockedUsersData = await Promise.all(
        blockedIds.map(async (userId) => {
          const userDoc = await getDoc(doc(db, 'users', userId));
          return { id: userId, ...userDoc.data() };
        })
      );
      setBlockedUsers(blockedUsersData);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showSnackbar('New passwords do not match', 'error');
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSnackbar('Password updated successfully', 'success');
    } catch (error) {
      console.error('Error updating password:', error);
      showSnackbar('Error updating password', 'error');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      let photoURL = currentUser.photoURL;
  
      if (avatarFile) {
        photoURL = await uploadImageToImgbb(avatarFile);
      }
  
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        username,
        bio,
        photoURL,
        updatedAt: serverTimestamp()
      });
  
      await updateProfile(currentUser, {
        displayName: username,
        photoURL
      });
  
      await currentUser.reload();
  
      showSnackbar('Profile updated successfully', 'success', { style: { color: 'white', fontWeight: 'bold' } });
      setAvatarFile(null);
      setAvatarPreview(null);
  
      setUserData(prev => ({
        ...prev,
        username,
        bio,
        photoURL
      }));
  
    } catch (error) {
      console.error('Error updating profile:', error);
      showSnackbar('Error updating profile', 'error');
    }
  };
  
  

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSavePrivacySettings = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        privacySettings
      });
      showSnackbar('Privacy settings updated successfully', 'success', { style: { color: 'white' } });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      showSnackbar('Error updating privacy settings', 'error');
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        notificationSettings
      });
      showSnackbar('Notification settings updated successfully', 'success');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      showSnackbar('Error updating notification settings', 'error');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        blockedUsers: arrayRemove(userId)
      });
      setBlockedUsers(blockedUsers.filter(user => user.id !== userId));
      showSnackbar('User unblocked successfully', 'success');
    } catch (error) {
      console.error('Error unblocking user:', error);
      showSnackbar('Error unblocking user', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        confirmDeletePassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Delete user data
      await deleteDoc(doc(db, 'users', currentUser.uid));

      // Delete user posts
      const postsRef = collection(db, 'posts');
      const userPostsQuery = query(postsRef, where('authorId', '==', currentUser.uid));
      const userPosts = await getDocs(userPostsQuery);
      await Promise.all(userPosts.docs.map(doc => deleteDoc(doc.ref)));

      // Delete user auth
      await deleteUser(currentUser);
      
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      showSnackbar('Error deleting account', 'error');
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

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Left Column - Profile Preview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <IconButton
                  component="label"
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    '&:hover': { bgcolor: theme.palette.primary.dark }
                  }}
                >
                  <CameraIcon sx={{ color: 'white', fontSize: 20 }} />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </IconButton>
              }
            >
              <Avatar
                src={avatarPreview || currentUser.photoURL}
                sx={{ 
                  width: 120, 
                  height: 120,
                  mx: 'auto',
                  border: `4px solid ${theme.palette.primary.main}`
                }}
              >
                {currentUser.displayName?.[0] || currentUser.email?.[0]}
              </Avatar>
            </Badge>
            <Typography variant="h6" sx={{ mt: 2 }}>
              {username || currentUser.displayName || 'Username'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentUser.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {bio || 'No bio added yet'}
            </Typography>
          </Paper>
        </Grid>

        {/* Right Column - Settings Tabs */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 2 }}>
            <Tabs
              value={currentTab}
              onChange={(e, newValue) => setCurrentTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<PersonIcon />} label="Profile" iconPosition="start" />
              <Tab icon={<LockIcon />} label="Password" iconPosition="start" />
              <Tab icon={<SecurityIcon />} label="Privacy" iconPosition="start" />
              <Tab icon={<NotificationsIcon />} label="Notifications" iconPosition="start" />
              <Tab icon={<BlockIcon />} label="Blocked Users" iconPosition="start" />
              <Tab icon={<DeleteIcon />} label="Delete Account" iconPosition="start" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Profile Tab */}
              {currentTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Profile Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      multiline
                      rows={4}
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      onClick={handleUpdateProfile}
                      startIcon={<SaveIcon />}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Password Tab */}
              {currentTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Change Password
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      type="password"
                      label="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      type="password"
                      label="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      type="password"
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      onClick={handleChangePassword}
                      startIcon={<SaveIcon />}
                      disabled={!currentPassword || !newPassword || !confirmPassword}
                    >
                      Update Password
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Privacy Tab */}
              {currentTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Privacy Settings
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.profileVisibility === 'public'}
                          onChange={(e) => setPrivacySettings(prev => ({
                            ...prev,
                            profileVisibility: e.target.checked ? 'public' : 'private'
                          }))}
                        />
                      }
                      label="Public Profile"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.postsVisibility === 'public'}
                          onChange={(e) => setPrivacySettings(prev => ({
                            ...prev,
                            postsVisibility: e.target.checked ? 'public' : 'private'
                          }))}
                        />
                      }
                      label="Public Posts"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.friendsListVisibility === 'public'}
                          onChange={(e) => setPrivacySettings(prev => ({
                            ...prev,
                            friendsListVisibility: e.target.checked ? 'public' : 'private'
                          }))}
                        />
                      }
                      label="Public Friends List"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.showOnlineStatus}
                          onChange={(e) => setPrivacySettings(prev => ({
                            ...prev,
                            showOnlineStatus: e.target.checked
                          }))}
                        />
                      }
                      label="Show Online Status"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.allowFriendRequests}
                          onChange={(e) => setPrivacySettings(prev => ({
                            ...prev,
                            allowFriendRequests: e.target.checked
                          }))}
                        />
                      }
                      label="Allow Friend Requests"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.allowMessages}
                          onChange={(e) => setPrivacySettings(prev => ({
                            ...prev,
                            allowMessages: e.target.checked
                          }))}
                        />
                      }
                      label="Allow Direct Messages"
                    />
                    <Button
                      variant="contained"
                      onClick={handleSavePrivacySettings}
                      startIcon={<SaveIcon />}
                      sx={{ mt: 2 }}
                    >
                      Save Privacy Settings
                    </Button>
                  </FormGroup>
                </Box>
              )}

              {/* Notifications Tab */}
              {currentTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Notification Settings
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            emailNotifications: e.target.checked
                          }))}
                        />
                      }
                      label="Email Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.pushNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            pushNotifications: e.target.checked
                          }))}
                        />
                      }
                      label="Push Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.friendRequests}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            friendRequests: e.target.checked
                          }))}
                        />
                      }
                      label="Friend Requests"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.messages}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            messages: e.target.checked
                          }))}
                        />
                      }
                      label="Direct Messages"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.postLikes}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            postLikes: e.target.checked
                          }))}
                        />
                      }
                      label="Post Likes"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.comments}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            comments: e.target.checked
                          }))}
                        />
                      }
                      label="Comments"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.mentions}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            mentions: e.target.checked
                          }))}
                        />
                      }
                      label="Mentions"
                    />
                    <Button
                      variant="contained"
                      onClick={handleSaveNotificationSettings}
                      startIcon={<SaveIcon />}
                      sx={{ mt: 2 }}
                    >
                      Save Notification Settings
                    </Button>
                  </FormGroup>
                </Box>
              )}

              {/* Blocked Users Tab */}
              {currentTab === 4 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Blocked Users
                  </Typography>
                  <List>
                    {blockedUsers.map(user => (
                      <ListItem key={user.id}>
                        <ListItemAvatar>
                          <Avatar src={user.photoURL}>
                            {user.username?.[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.username}
                          secondary={user.email}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Unblock User">
                            <IconButton
                              edge="end"
                              onClick={() => handleUnblockUser(user.id)}
                              color="primary"
                            >
                              <PersonOffIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                    {blockedUsers.length === 0 && (
                      <Typography variant="body2" color="text.secondary" align="center">
                        No blocked users
                      </Typography>
                    )}
                  </List>
                </Box>
              )}

              {/* Delete Account Tab */}
              {currentTab === 5 && (
                <Box>
                  <Typography variant="h6" gutterBottom color="error">
                    Delete Account
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This action cannot be undone. All your data will be permanently deleted.
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => setDeleteAccountDialog(true)}
                    startIcon={<DeleteIcon />}
                  >
                    Delete Account
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Account Dialog */}
      <Dialog
        open={deleteAccountDialog}
        onClose={() => setDeleteAccountDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Account Deletion</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Please enter your password to confirm account deletion:
          </Typography>
          <TextField
            type="password"
            label="Password"
            value={confirmDeletePassword}
            onChange={(e) => setConfirmDeletePassword(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={!confirmDeletePassword}
          >
            Delete Account
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

export default Settings;
