import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/config';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp, getDoc, doc
} from 'firebase/firestore';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { createMessageNotification } from '../../services/NotificationService';

const ChatWindow = () => {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const messagesEndRef = useRef(null);

  // Generate a consistent conversation ID by sorting user IDs
  const getConversationId = (uid1, uid2) => {
    return uid1 < uid2 ? uid1 + '_' + uid2 : uid2 + '_' + uid1;
  };

  const conversationId = getConversationId(currentUser.uid, friendId);

  useEffect(() => {
    // Fetch friend user data
    const fetchFriend = async () => {
      try {
        const friendDocRef = doc(db, 'users', friendId);
        const friendDocSnap = await getDoc(friendDocRef);
        if (friendDocSnap.exists()) {
          setFriend({ id: friendDocSnap.id, ...friendDocSnap.data() });
        } else {
          setSnackbar({ open: true, message: 'Friend not found', severity: 'error' });
        }
      } catch (error) {
        setSnackbar({ open: true, message: 'Error loading friend data', severity: 'error' });
      }
    };

    fetchFriend();
  }, [friendId]);

  useEffect(() => {
    // Subscribe to messages in this conversation
    const messagesQuery = query(
      collection(db, 'messages', conversationId, 'chat'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setLoading(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [conversationId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        senderId: currentUser.uid,
        receiverId: friendId,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        conversationId
      };

      await addDoc(collection(db, 'messages', conversationId, 'chat'), messageData);

      // Create notification for the receiver
      await createMessageNotification(friendId, friend.email || '', messageData, {
        uid: currentUser.uid,
        username: currentUser.displayName,
        photoURL: currentUser.photoURL
      });

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to send message', severity: 'error' });
    }
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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <IconButton onClick={() => navigate(-1)} aria-label="back">
          <ArrowBackIcon />
        </IconButton>
        {friend && (
          <>
            <Avatar src={friend.photoURL} sx={{ ml: 1, mr: 2 }} />
            <Typography variant="h6">{friend.username}</Typography>
          </>
        )}
      </Box>

      {/* Messages List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        <List>
          {messages.map((msg) => {
            const isSender = msg.senderId === currentUser.uid;
            return (
              <ListItem key={msg.id} sx={{ justifyContent: isSender ? 'flex-end' : 'flex-start' }}>
                {!isSender && (
                  <ListItemAvatar>
                    <Avatar src={friend.photoURL} />
                  </ListItemAvatar>
                )}
                <ListItemText
                  primary={msg.content}
                  sx={{
                    bgcolor: isSender ? 'primary.main' : 'grey.700',
                    color: 'white',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    maxWidth: '60%',
                    textAlign: isSender ? 'right' : 'left'
                  }}
                />
                {isSender && (
                  <ListItemAvatar>
                    <Avatar src={currentUser.photoURL} />
                  </ListItemAvatar>
                )}
              </ListItem>
            );
          })}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          multiline
          maxRows={4}
        />
        <Button variant="contained" onClick={handleSendMessage} disabled={!newMessage.trim()}>
          Send
        </Button>
      </Box>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatWindow;
