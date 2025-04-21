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
  addDoc
} from 'firebase/firestore';
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
  Divider
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
  Flag as FlagIcon
} from '@mui/icons-material';
import moment from 'moment';

const AdminDashboard = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspensionDialog, setSuspensionDialog] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState('7');
  const [reportDetails, setReportDetails] = useState(null);
  const [reportDialog, setReportDialog] = useState(false);
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
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(reportsQuery);
    setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchFlaggedContent = async () => {
    const contentQuery = query(
      collection(db, 'posts'),
      where('flags', '>', 0),
      orderBy('flags', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(contentQuery);
    setFlaggedContent(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      await updateDoc(reportRef, {
        status: 'resolved',
        resolution: action,
        resolvedAt: new Date().toISOString(),
        resolvedBy: auth.currentUser.uid
      });
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
            onClick={() => handleResolveReport(reportDetails?.id, 'warning')}
            color="warning"
          >
            Warn User
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
    </Container>
  );
};

export default AdminDashboard;
