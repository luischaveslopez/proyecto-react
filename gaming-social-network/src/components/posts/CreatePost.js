import React, { useState } from 'react';
import { db, storage, auth } from '../../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Box,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Avatar,
  Divider,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Image as ImageIcon,
  VideogameAsset as GameIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Link as LinkIcon,
  VideoLibrary as VideoIcon,
  EmojiEmotions as EmojiIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { EmojiEvents as EmojiIcon2 } from '@mui/icons-material';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import { AddLink as LinkIcon2 } from '@mui/icons-material';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import GamesIcon from '@mui/icons-material/Games';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [link, setLink] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [privacy, setPrivacy] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gameTag, setGameTag] = useState('');
  const theme = useTheme();
  const currentUser = auth.currentUser;

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setMediaType('image');
        setMedia(file);
      } else if (file.type.startsWith('video/')) {
        setMediaType('video');
        setMedia(file);
      } else {
        setError('Please select an image or video file');
      }
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !media && !link) {
      setError('Post cannot be empty');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to create a post');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let mediaUrl = '';
      if (media) {
        const mediaRef = ref(storage, `post-media/${Date.now()}_${media.name}`);
        await uploadBytes(mediaRef, media);
        mediaUrl = await getDownloadURL(mediaRef);
      }

      if (link && !isValidUrl(link)) {
        setError('Please enter a valid URL');
        return;
      }

      const postData = {
        content,
        mediaUrl,
        mediaType,
        link: link || '',
        authorId: currentUser.uid,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: [],
        privacy,
        gameTag,
        shares: 0,
        type: mediaType || (link ? 'link' : 'text')
      };

      const docRef = await addDoc(collection(db, 'posts'), postData);

      // Reset form
      setContent('');
      setMedia(null);
      setMediaType(null);
      setLink('');
      setShowLinkInput(false);
      setGameTag('');
      setPrivacy('public');

      if (onPostCreated) {
        onPostCreated({ id: docRef.id, ...postData });
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (

    // Visual //

    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        <Avatar
          src={currentUser?.photoURL}
          alt={currentUser?.displayName}
          sx={{ width: 40, height: 40 }}
        />
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="What's on your gamer mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              }
            }}
          />
        </Box>
      </Box>

      {media && (
        <Box 
          sx={{ 
            position: 'relative',
            mb: 2,
            borderRadius: 1,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          <IconButton
            size="small"
            onClick={() => {
              setMedia(null);
              setMediaType(null);
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              }
            }}
          >
            <CloseIcon sx={{ color: 'white' }} />
          </IconButton>
          {mediaType === 'image' && (
            <img
              src={URL.createObjectURL(media)}
              alt="Preview"
              style={{ 
                width: '100%',
                maxHeight: 300,
                objectFit: 'cover'
              }}
            />
          )}
        </Box>
      )}

      {showLinkInput && (
        <TextField
          fullWidth
          placeholder="Enter URL"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          disabled={loading}
          sx={{ mb: 2 }}
        />
      )}

      <Divider sx={{ my: 2 }} />

      <Stack 
        direction="row" 
        spacing={1} 
        alignItems="center" 
        justifyContent="space-between"
        sx={{ flexWrap: 'wrap', gap: 1 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <input
            type="file"
            accept="image/*,video/*"
            id="media-upload"
            style={{ display: 'none' }}
            onChange={handleMediaChange}
            disabled={loading || showLinkInput}
          />
          <label htmlFor="media-upload">
            <Tooltip title="Add photo/video">
              <IconButton 
                component="span" 
                disabled={loading || showLinkInput}
                color="primary"
                size="small"
              >
                {mediaType === 'video' ? <VideoIcon /> : <SubscriptionsIcon />}
              </IconButton>
            </Tooltip>
          </label>

          <Tooltip title="Add link">
            <IconButton 
              onClick={() => setShowLinkInput(!showLinkInput)} 
              disabled={loading || media !== null}
              color="primary"
              size="small"
            >
              <LinkIcon2 />
            </IconButton>
          </Tooltip>

          <Tooltip title="Add a emoji">
            <IconButton
              color="primary"
              size="small"
            >
              <EmojiIcon2 />
            </IconButton>
          </Tooltip>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={gameTag}
              onChange={(e) => setGameTag(e.target.value)}
              displayEmpty
              disabled={loading}
            >
              <MenuItem value="">
                <GamesIcon sx={{ mr: 1, fontSize: 20 }} /> Select Game
              </MenuItem>
              <MenuItem value="minecraft">Minecraft</MenuItem>
              <MenuItem value="fortnite">Fortnite</MenuItem>
              <MenuItem value="cod">Call of Duty</MenuItem>
              <MenuItem value="lol">League of Legends</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small">
            <Select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="public">
                <PublicIcon sx={{ mr: 1, fontSize: 20 }} /> Public
              </MenuItem>
              <MenuItem value="friends">
                <SupervisorAccountIcon sx={{ mr: 1, fontSize: 20 }} /> Friends
              </MenuItem>
              <MenuItem value="private">
                <LockPersonIcon sx={{ mr: 1, fontSize: 20}} /> Private
              </MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            disabled={loading || (!content.trim() && !media && !link)}
            onClick={handleSubmit}
            sx={{ 
              minWidth: 100,
              borderRadius: '20px'
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Post'}
          </Button>
        </Box>
      </Stack>

      {error && (
        <Typography 
          color="error" 
          variant="body2" 
          sx={{ mt: 2, textAlign: 'center' }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default CreatePost;
