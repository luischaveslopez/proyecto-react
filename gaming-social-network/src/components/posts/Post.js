import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, deleteDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { createLikeNotification, createCommentNotification, createShareNotification } from '../../services/NotificationService';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Divider,
  useTheme,
  Tooltip,
  Zoom,
  Badge,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ChatBubbleOutline as CommentIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  VideogameAsset as GameIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EmojiEmotions as EmojiIcon,
  Send as SendIcon,
  ReportProblem as ReportProblemIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const Post = ({ post, onDelete, onUpdate }) => {
  const [author, setAuthor] = useState(null);
  const [liked, setLiked] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [editedLink, setEditedLink] = useState(post.link || '');
  const [editedPrivacy, setEditedPrivacy] = useState(post.privacy || 'public');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const theme = useTheme();
  const currentUser = auth.currentUser;

  useEffect(() => {
    fetchAuthor();
    setLiked(post.likes?.includes(currentUser?.uid));
  }, [post, currentUser]);

  const fetchAuthor = async () => {
    try {
      const authorDoc = await getDoc(doc(db, 'users', post.authorId));
      if (authorDoc.exists()) {
        setAuthor(authorDoc.data());
      }
    } catch (error) {
      console.error('Error fetching author:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    // Handle Firestore Timestamp
    if (timestamp.toDate) {
      return moment(timestamp.toDate()).fromNow();
    }
    
    // Handle ISO string
    if (typeof timestamp === 'string') {
      return moment(timestamp).fromNow();
    }
    
    // Handle JavaScript Date
    if (timestamp instanceof Date) {
      return moment(timestamp).fromNow();
    }

    return '';
  };

  const handleLike = async () => {
    if (!currentUser) return;
    
    try {
      const postRef = doc(db, 'posts', post.id);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      if (liked) {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUser.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid)
        });

        // Only send notification when liking, not when unliking
        if (post.authorId !== currentUser.uid) {
          await createLikeNotification(
            post.authorId,
            author.email,
            post,
            {
              uid: currentUser.uid,
              username: userData.username,
              photoURL: userData.photoURL
            }
          );
        }
      }
      setLiked(!liked);
    } catch (error) {
      console.error('Error updating like:', error);
      setSnackbar({
        open: true,
        message: 'Error updating like',
        severity: 'error'
      });
    }
  };

  const handleComment = async () => {
    if (!comment.trim() || !currentUser) return;
  
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) throw new Error('El usuario actual no existe');
  
      const userData = userDoc.data();
      const postRef = doc(db, 'posts', post.id);
  
      const commentData = {
        userId: currentUser.uid,
        username: userData.username,
        photoURL: userData.photoURL,
        content: comment,
        timestamp: Timestamp.now()  // Timestamp.now() for Firestore
      };
  
      await updateDoc(postRef, {
        comments: arrayUnion(commentData)
      });
  
      setComment('');
      setSnackbar({
        open: true,
        message: 'Comentario agregado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al comentar:', error);
      setSnackbar({
        open: true,
        message: 'Error al agregar el comentario',
        severity: 'error'
      });
    }
  };
  

  const handleShare = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      const sharedPost = {
        content: `Shared ${author.username}'s post:\n\n${post.content}`,
        originalPostId: post.id,
        originalAuthorId: post.authorId,
        originalAuthorName: author.username,
        authorId: currentUser.uid,
        authorName: userData.username,
        timestamp: serverTimestamp(),
        likes: [],
        comments: [],
        privacy: 'public',
        type: 'share',
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        gameTag: post.gameTag
      };

      await addDoc(collection(db, 'posts'), sharedPost);

      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        shares: (post.shares || 0) + 1
      });

      // Send notification if sharing someone else's post
      if (post.authorId !== currentUser.uid) {
        await createShareNotification(
          post.authorId,
          author.email,
          post,
          {
            uid: currentUser.uid,
            username: userData.username,
            photoURL: userData.photoURL
          }
        );
      }

      setSnackbar({
        open: true,
        message: 'Post shared successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error sharing post:', error);
      setSnackbar({
        open: true,
        message: 'Error sharing post',
        severity: 'error'
      });
    }
  };

  const handleReportPost = async () => {
    if (!currentUser) return;

    try {
      // CHANGE //
      const postRef = doc(db, "posts", post.id);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) {
        console.error("Post does not exist");
        return;
      }

      const postData = postSnap.data();
      const reportedUserId = postData.authorId;

      await addDoc(collection(db, "reports"), {
        postId: post.id,
        reportedBy: currentUser.uid,
        reportedUserId,
        reason: "Inappropriate content",
        status: "pending",
        timestamp: serverTimestamp(),
      });

      setSnackbar({
        open: true,
        message: "Thanks for reporting. We will review this post.",
        severity: "info",
      });
    } catch (error) {
      console.error("Error reporting post:", error);
      setSnackbar({
        open: true,
        message: "Failed to report post.",
        severity: "error",
      });
    }
  };

  const handleEdit = async () => {
    try {
      const postRef = doc(db, 'posts', post.id);
      const updates = {
        content: editedContent,
        link: editedLink, 
        privacy: editedPrivacy,
        edited: true,
        editedAt: serverTimestamp()
      };
      


      await updateDoc(postRef, updates);
      setEditMode(false);
      if (onUpdate) onUpdate();

      setSnackbar({
        open: true,
        message: 'Post updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating post:', error);
      setSnackbar({
        open: true,
        message: 'Error updating post',
        severity: 'error'
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      if (onDelete) onDelete();

      setSnackbar({
        open: true,
        message: 'Post deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting post',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (!author) return null;

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: theme.shadows[2],
        "&:hover": {
          boxShadow: theme.shadows[4],
          transform: "translateY(-2px)",
          transition: "all 0.3s ease",
        },
      }}
    >
      <CardHeader
        avatar={
          <Avatar
            src={author?.photoURL}
            sx={{
              cursor: "pointer",
              width: 45,
              height: 45,
              border: `2px solid ${theme.palette.primary.main}`,
            }}
            onClick={() => navigate(`/profile/${post.authorId}`)}
          >
            {author?.username?.[0]}
          </Avatar>
        }
        action={
          currentUser?.uid === post.authorId && (
            <>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem
                  onClick={() => {
                    setEditMode(true);
                    setAnchorEl(null);
                  }}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <EditIcon sx={{ mr: 1, fontSize: 20 }} /> Edit
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleDelete();
                    setAnchorEl(null);
                  }}
                  sx={{ color: theme.palette.error.main }}
                >
                  <DeleteIcon sx={{ mr: 1, fontSize: 20 }} /> Delete
                </MenuItem>
              </Menu>
            </>
          )
        }
        title={
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              cursor: "pointer",
              "&:hover": { color: theme.palette.primary.main },
            }}
            onClick={() => navigate(`/profile/${post.authorId}`)}
          >
            {author?.username}
          </Typography>
        }
        subheader={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(post.timestamp)}
            </Typography>
            {post.edited && (
              <Typography variant="caption" color="text.secondary">
                • edited
              </Typography>
            )}
            {post.privacy !== "public" && (
              <Tooltip title={`Visible to ${post.privacy}`}>
                <Box component="span">
                  {post.privacy === "friends" ? (
                    <GameIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  ) : (
                    <LockIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  )}
                </Box>
              </Tooltip>
            )}
          </Box>
        }
      />

      <CardContent>
        {post.type === "share" && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              bgcolor: "background.default",
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              Shared from @{post.originalAuthorName}
            </Typography>
            <Typography variant="body2">{post.content}</Typography>
          </Box>
        )}

        <Typography
          variant="body1"
          sx={{
            whiteSpace: "pre-wrap",
            mb: 2,
          }}
        >
          {post.content}
        </Typography>

        {post.gameTag && (
          <Chip
            icon={<GameIcon />}
            label={post.gameTag}
            size="small"
            color="primary"
            variant="outlined"
            sx={{
              mb: 2,
              borderRadius: "16px",
              "& .MuiChip-icon": {
                color: "inherit",
              },
            }}
          />
        )}

        {post.mediaUrl && post.mediaType === "image" && (
          <Box
            sx={{
              position: "relative",
              borderRadius: 2,
              overflow: "hidden",
              mb: 2,
            }}
          >
            <img
              src={post.mediaUrl}
              alt="Post content"
              style={{
                width: "100%",
                maxHeight: "500px",
                objectFit: "cover",
              }}
            />
          </Box>
        )}

        {post.mediaUrl && post.mediaType === "video" && (
          <Box
            sx={{
              position: "relative",
              borderRadius: 2,
              overflow: "hidden",
              mb: 2,
            }}
          >
            <video
              src={post.mediaUrl}
              controls
              style={{
                width: "100%",
                maxHeight: "500px",
                backgroundColor: "#000",
              }}
            />
          </Box>
        )}

        {post.link && (
          <Box
            component="a"
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "block",
              p: 2,
              bgcolor: "background.default",
              borderRadius: 1,
              textDecoration: "none",
              color: "text.primary",
              border: `1px solid ${theme.palette.divider}`,
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <Typography variant="body2" color="primary">
              {post.link}
            </Typography>
          </Box>
        )}
      </CardContent>

      <Divider />

      <CardActions sx={{ px: 2, py: 1 }}>
        <Box
          sx={{ display: "flex", alignItems: "center", width: "100%", gap: 2 }}
        >
          <Tooltip title={liked ? "Unlike" : "Like"} TransitionComponent={Zoom}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                onClick={handleLike}
                disabled={!currentUser}
                color={liked ? "error" : "default"}
              >
                {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                {post.likes?.length || 0}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="Comment" TransitionComponent={Zoom}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                onClick={() => setCommentOpen(true)}
                disabled={!currentUser}
                color={commentOpen ? "primary" : "default"}
              >
                <Badge
                  badgeContent={post.comments?.length || 0}
                  color="primary"
                >
                  <CommentIcon />
                </Badge>
              </IconButton>
            </Box>
          </Tooltip>

          <Tooltip title="Share" TransitionComponent={Zoom}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                onClick={handleShare}
                disabled={!currentUser}
                color={post.shares > 0 ? "primary" : "default"}
              >
                <ShareIcon />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                {post.shares || 0}
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title="Report" TransitionComponent={Zoom}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                onClick={handleReportPost}
                disabled={!currentUser}
                color="warning"
              >
                <ReportProblemIcon />
              </IconButton>
            </Box>
          </Tooltip>
        </Box>
      </CardActions>

      {/* Edit Dialog */}
      <Dialog
        open={editMode}
        onClose={() => setEditMode(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>Edit Post</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              label="Post content"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Link (opcional)"
              value={editedLink}
              onChange={(e) => setEditedLink(e.target.value)}
              variant="outlined"
            />
            <FormControl fullWidth>
              <InputLabel>Privacy</InputLabel>
              <Select
                value={editedPrivacy}
                onChange={(e) => setEditedPrivacy(e.target.value)}
                label="Privacy"
              >
                <MenuItem value="public">
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PublicIcon sx={{ mr: 1 }} /> Public
                  </Box>
                </MenuItem>
                <MenuItem value="friends">
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <GameIcon sx={{ mr: 1 }} /> Friends Only
                  </Box>
                </MenuItem>
                <MenuItem value="private">
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <LockIcon sx={{ mr: 1 }} /> Private
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditMode(false)}>Cancel</Button>
          <Button
            onClick={handleEdit}
            variant="contained"
            startIcon={<EditIcon />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog
        open={commentOpen}
        onClose={() => setCommentOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          Comments ({post.comments?.length || 0})
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ maxHeight: 400, overflowY: "auto", p: 2 }}>
            {post.comments?.map((comment, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: "background.default",
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Avatar
                    src={comment.photoURL}
                    sx={{ width: 24, height: 24, mr: 1 }}
                  >
                    {comment.username?.[0]}
                  </Avatar>
                  <Typography
                    variant="subtitle2"
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  >
                    {comment.username}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    • {formatTimestamp(comment.timestamp)}
                  </Typography>
                </Box>
                <Typography variant="body2">{comment.content}</Typography>
              </Box>
            ))}
            {(!post.comments || post.comments.length === 0) && (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                }}
              >
                <EmojiIcon
                  sx={{ fontSize: 40, color: "text.secondary", mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  No comments yet. Be the first to comment!
                </Typography>
              </Box>
            )}
          </Box>

          <Divider />

          {currentUser ? (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Avatar
                  src={currentUser.photoURL}
                  sx={{ width: 32, height: 32 }}
                >
                  {currentUser.displayName?.[0]}
                </Avatar>
                <TextField
                  fullWidth
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  multiline
                  maxRows={4}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={handleComment}
                        disabled={!comment.trim()}
                        color="primary"
                        size="small"
                      >
                        <SendIcon />
                      </IconButton>
                    ),
                  }}
                />
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Please log in to comment
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default Post;
