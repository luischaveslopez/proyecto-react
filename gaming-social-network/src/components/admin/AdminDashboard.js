import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  addDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  getContentRestrictions,
  addContentRestriction,
  deleteContentRestriction
} from '../../firebase/contentRestrictionService';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Badge,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  Divider,
  MenuItem
} from '@mui/material';
import {
  Block as BlockIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as ApproveIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  Report as ReportIcon,
  Person as PersonIcon,
  Article as ContentIcon,
  Flag as FlagIcon,
  Add as AddIcon,
  TextFields as TextFieldsIcon,
  Link as LinkIcon,
  Code as CodeIcon
} from '@mui/icons-material';

import moment from 'moment';

const AdminDashboard = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [contentRestrictions, setContentRestrictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restrictionDialog, setRestrictionDialog] = useState(false);
  const [newRestriction, setNewRestriction] = useState({
    type: 'word',
    value: '',
    message: ''
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspensionDialog, setSuspensionDialog] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState('7');
  const [reportDetails, setReportDetails] = useState(null);
  const [reportDialog, setReportDialog] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningDialog, setWarningDialog] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    fetchData();
  }, [currentTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (currentTab) {
        case 0: // Users
          await fetchUsers();
          break;
        case 1: // Reports
          await fetchReports();
          break;
        case 2: // Flagged Content
          await fetchFlaggedContent();
          break;
        case 3: // Content Restrictions
          await fetchContentRestrictions();
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(usersQuery);
    setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchReports = async () => {
    const reportsQuery = query(
      collection(db, 'reports'),
      where('status', '==', 'pending'),
      limit(20)
    );
    const snapshot = await getDocs(reportsQuery);
    setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchFlaggedContent = async () => {
    const contentQuery = query(
      collection(db, 'posts'),
      where('flags', '>', 0),
      limit(20)
    );
    const snapshot = await getDocs(contentQuery);
    setFlaggedContent(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchContentRestrictions = async () => {
    try {
      const restrictions = await getContentRestrictions();
      setContentRestrictions(restrictions);
    } catch (error) {
      console.error('Error fetching content restrictions:', error);
    }
  };

  const handleAddRestriction = async () => {
    try {
      await addContentRestriction(newRestriction);
      setRestrictionDialog(false);
      setNewRestriction({ type: 'word', value: '', message: '' });
      fetchContentRestrictions();
    } catch (error) {
      console.error('Error adding restriction:', error);
    }
  };

  const handleDeleteRestriction = async (restrictionId) => {
    try {
      await deleteContentRestriction(restrictionId);
      fetchContentRestrictions();
    } catch (error) {
      console.error('Error deleting restriction:', error);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser || !suspensionReason) return;

    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        suspended: true,
        suspensionReason,
        suspensionDuration: parseInt(suspensionDuration),
        suspendedAt: new Date().toISOString()
      });

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        userId: selectedUser.id,
        type: 'suspension',
        message: `Your account has been suspended for ${suspensionDuration} days: ${suspensionReason}`,
        timestamp: new Date().toISOString(),
        read: false
      });

      setSuspensionDialog(false);
      setSuspensionReason('');
      setSuspensionDuration('7');
      fetchUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  const handleDeleteContent = async (contentId) => {
    try {
      await deleteDoc(doc(db, 'posts', contentId));
      fetchFlaggedContent();
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      const reportDoc = await getDoc(reportRef);
      const reportData = reportDoc.data();

      // Update report status
      await updateDoc(reportRef, {
        status: 'resolved',
        resolution: action,
        resolvedAt: serverTimestamp(),
        resolvedBy: auth.currentUser.uid
      });

      // Notify the reporter
      await addDoc(collection(db, 'notifications'), {
        userId: reportData.reporterId,
        type: 'reportResolved',
        message: `Your report has been reviewed and ${action}`,
        timestamp: serverTimestamp(),
        read: false
      });

      // If warning, notify reported user with custom message
      if (action === 'warning') {
        await addDoc(collection(db, 'notifications'), {
          userId: reportData.reportedUserId,
          type: 'warning',
          message: warningMessage || 'You have received a warning from the administrators',
          timestamp: serverTimestamp(),
          read: false
        });
        setWarningDialog(false);
        setWarningMessage('');
      }

      setReportDialog(false);
      fetchReports();
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  const renderUsersList = () => (
    <List>
      {users.map(user => (
        <ListItem
          key={user.id}
          sx={{
            borderRadius: 1,
            mb: 1,
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <ListItemAvatar>
            <Avatar src={user.photoURL}>
              {user.username?.[0]}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {user.username}
                {user.suspended && (
                  <Chip
                    size="small"
                    label="Suspended"
                    color="error"
                    variant="outlined"
                  />
                )}
                {user.isAdmin && (
                  <Chip
                    size="small"
                    label="Admin"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            }
            secondary={user.email}
          />
          <ListItemSecondaryAction>
            <Tooltip title="Suspend User">
              <IconButton
                edge="end"
                onClick={() => {
                  setSelectedUser(user);
                  setSuspensionDialog(true);
                }}
                color="warning"
              >
                <BlockIcon />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  const renderReportsList = () => (
    <List>
      {reports.map(report => (
        <ListItem
          key={report.id}
          sx={{
            borderRadius: 1,
            mb: 1,
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: 'warning.main' }}>
              <ReportIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={`Report #${report.id.slice(0, 8)}`}
            secondary={
              <>
                <Typography variant="body2" component="span">
                  {moment(report.timestamp).fromNow()}
                </Typography>
                <br />
                <Typography variant="body2" color="text.secondary">
                  {report.reason}
                </Typography>
              </>
            }
          />
          <ListItemSecondaryAction>
            <Tooltip title="View Details">
              <IconButton
                edge="end"
                onClick={() => {
                  setReportDetails(report);
                  setReportDialog(true);
                }}
              >
                <WarningIcon />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  const renderFlaggedContent = () => (
    <List>
      {flaggedContent.map(content => (
        <ListItem
          key={content.id}
          sx={{
            borderRadius: 1,
            mb: 1,
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <ListItemAvatar>
            <Badge badgeContent={content.flags} color="error">
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <FlagIcon />
              </Avatar>
            </Badge>
          </ListItemAvatar>
          <ListItemText
            primary={content.content}
            secondary={
              <>
                <Typography variant="body2" component="span">
                  Posted {moment(content.timestamp).fromNow()}
                </Typography>
                <br />
                <Typography variant="body2" color="text.secondary">
                  {content.flags} flags
                </Typography>
              </>
            }
          />
          <ListItemSecondaryAction>
            <Tooltip title="Delete Content">
              <IconButton
                edge="end"
                onClick={() => handleDeleteContent(content.id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  const renderContentRestrictions = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setRestrictionDialog(true)}
        >
          Add Restriction
        </Button>
      </Box>
      <List>
        {contentRestrictions.map(restriction => (
          <ListItem
            key={restriction.id}
            sx={{
              borderRadius: 1,
              mb: 1,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {restriction.type === 'word' ? <TextFieldsIcon /> :
                  restriction.type === 'link' ? <LinkIcon /> :
                    <CodeIcon />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={restriction.value}
              secondary={
                <>
                  <Typography variant="body2" component="span">
                    Type: {restriction.type}
                  </Typography>
                  {restriction.message && (
                    <>
                      <br />
                      <Typography variant="body2" color="text.secondary">
                        Message: {restriction.message}
                      </Typography>
                    </>
                  )}
                </>
              }
            />
            <ListItemSecondaryAction>
              <Tooltip title="Delete Restriction">
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteRestriction(restriction.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AdminIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Typography variant="h5" component="h1">
            Admin Dashboard
          </Typography>
          <IconButton
            sx={{ ml: 'auto' }}
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshIcon />
          </IconButton>
        </Box>

        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab
            icon={<PersonIcon />}
            label="Users"
            iconPosition="start"
          />
          <Tab
            icon={<ReportIcon />}
            label={`Reports ${reports.length ? `(${reports.length})` : ''}`}
            iconPosition="start"
          />
          <Tab
            icon={<ContentIcon />}
            label="Flagged Content"
            iconPosition="start"
          />
          <Tab
            icon={<BlockIcon />}
            label="Content Restrictions"
            iconPosition="start"
          />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {currentTab === 0 && renderUsersList()}
            {currentTab === 1 && renderReportsList()}
            {currentTab === 2 && renderFlaggedContent()}
            {currentTab === 3 && renderContentRestrictions()}
          </>
        )}
      </Paper>

      {/* Suspension Dialog */}
      <Dialog
        open={suspensionDialog}
        onClose={() => setSuspensionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Suspend User: {selectedUser?.username}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Suspension Reason"
              multiline
              rows={3}
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              fullWidth
            />
            <TextField
              label="Suspension Duration (days)"
              type="number"
              value={suspensionDuration}
              onChange={(e) => setSuspensionDuration(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuspensionDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSuspendUser}
            variant="contained"
            color="warning"
            disabled={!suspensionReason}
          >
            Suspend User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Details Dialog */}
      <Dialog
        open={reportDialog}
        onClose={() => setReportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Report Details
        </DialogTitle>
        <DialogContent>
          {reportDetails && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Reporter: {reportDetails.reporterName}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Reported: {reportDetails.reportedName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Reason: {reportDetails.reason}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reported {moment(reportDetails.timestamp).fromNow()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleResolveReport(reportDetails?.id, 'dismissed')}
            color="inherit"
          >
            Dismiss
          </Button>
          <Button
            onClick={() => {
              setWarningDialog(true);
            }}
            color="warning"
          >
            Send Warning
          </Button>
          <Button
            onClick={() => {
              setSelectedUser({ id: reportDetails.reportedId });
              setSuspensionDialog(true);
              setReportDialog(false);
            }}
            variant="contained"
            color="error"
          >
            Suspend User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Warning Message Dialog */}
      <Dialog
        open={warningDialog}
        onClose={() => setWarningDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Send Warning to User
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Sending warning to: {reportDetails?.reportedName}
            </Typography>
            <TextField
              label="Warning Message"
              multiline
              rows={4}
              value={warningMessage}
              onChange={(e) => setWarningMessage(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
              placeholder="Enter a detailed warning message explaining the reason for the warning..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWarningDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => handleResolveReport(reportDetails?.id, 'warning')}
            variant="contained"
            color="warning"
            disabled={!warningMessage}
          >
            Send Warning
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Restriction Dialog */}
      <Dialog
        open={restrictionDialog}
        onClose={() => setRestrictionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add Content Restriction
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Restriction Type"
              value={newRestriction.type}
              onChange={(e) => setNewRestriction(prev => ({ ...prev, type: e.target.value }))}
              fullWidth
            >
              <MenuItem value="word">Banned Word</MenuItem>
              <MenuItem value="link">Restricted Link/Domain</MenuItem>
              <MenuItem value="pattern">Custom Pattern</MenuItem>
            </TextField>
            <TextField
              label={newRestriction.type === 'pattern' ? 'Regular Expression' : 'Value'}
              value={newRestriction.value}
              onChange={(e) => setNewRestriction(prev => ({ ...prev, value: e.target.value }))}
              fullWidth
              helperText={
                newRestriction.type === 'word' ? 'Enter a word to ban' :
                  newRestriction.type === 'link' ? 'Enter a domain or URL pattern' :
                    'Enter a regular expression pattern'
              }
            />
            <TextField
              label="Custom Message"
              value={newRestriction.message}
              onChange={(e) => setNewRestriction(prev => ({ ...prev, message: e.target.value }))}
              fullWidth
              multiline
              rows={2}
              helperText="Message to show when content is restricted (optional)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestrictionDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleAddRestriction}
            variant="contained"
            color="primary"
            disabled={!newRestriction.value}
          >
            Add Restriction
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;