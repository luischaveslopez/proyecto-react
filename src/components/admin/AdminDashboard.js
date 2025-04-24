import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  TextField
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Report as ReportIcon,
  ContentPaste as ContentIcon
} from '@mui/icons-material';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [suspensionDialog, setSuspensionDialog] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState('');
  const [reportDialog, setReportDialog] = useState(false);
  const [reportDetails, setReportDetails] = useState(null);

  const fetchData = () => {
    setLoading(true);
    // Simulate data fetching
    setTimeout(() => setLoading(false), 1000);
  };

  const handleSuspendUser = () => {
    // Logic to suspend user
    setSuspensionDialog(false);
  };

  const handleResolveReport = () => {
    // Logic to resolve report
    setReportDialog(false);
  };

  const renderUsersList = () => <div>Users List</div>;
  const renderReportsList = () => <div>Reports List</div>;
  const renderFlaggedContent = () => <div>Flagged Content</div>;

  return (
    <Container>
      <Paper>
        <Box>
          <IconButton onClick={fetchData}>
            <RefreshIcon />
          </IconButton>
          <Typography variant="h4">Admin Dashboard</Typography>
        </Box>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab icon={<PersonIcon />} label="Users" />
          <Tab icon={<ReportIcon />} label="Reports" />
          <Tab icon={<ContentIcon />} label="Flagged Content" />
        </Tabs>
        {loading ? (
          <Box>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {currentTab === 0 && renderUsersList()}
            {currentTab === 1 && renderReportsList()}
            {currentTab === 2 && renderFlaggedContent()}
          </Box>
        )}
        <Dialog open={suspensionDialog} onClose={() => setSuspensionDialog(false)}>
          <DialogTitle>Suspend User</DialogTitle>
          <DialogContent>
            <TextField
              label="Reason"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
            />
            <TextField
              label="Duration"
              value={suspensionDuration}
              onChange={(e) => setSuspensionDuration(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSuspensionDialog(false)}>Cancel</Button>
            <Button onClick={handleSuspendUser}>Suspend</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={reportDialog} onClose={() => setReportDialog(false)}>
          <DialogTitle>Report Details</DialogTitle>
          <DialogContent>
            <Typography>{reportDetails}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReportDialog(false)}>Close</Button>
            <Button onClick={handleResolveReport}>Resolve</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;