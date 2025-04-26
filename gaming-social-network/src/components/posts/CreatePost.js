import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { db, storage, auth } from '../../firebase/config';
import { collection, addDoc, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
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
import { checkInappropriateContent } from '../../utils/moderation';
import { EmojiEvents as EmojiIcon2 } from '@mui/icons-material';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import { AddLink as LinkIcon2 } from '@mui/icons-material';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import GamesIcon from '@mui/icons-material/Games';



const uploadImageToImgbb = async (file) => {
  const apiKey = 'c219f99abffb6810a5c657dfc480d1f5'; 
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error('Error uploading image');
  }

  return data.data.url; //image link
};


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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const theme = useTheme();
  const currentUser = auth.currentUser;
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const updateGamePopularity = async (gameTag) => {
    if (!gameTag) return;

    try {
      const gameRef = doc(db, 'games', gameTag);
      const gameDoc = await getDoc(gameRef);

      if (gameDoc.exists()) {
        // Update existing game document
        await updateDoc(gameRef, {
          postCount: increment(1),
          players: increment(1),
          lastUpdated: new Date().toISOString()
        });
      } else {
        // Create new game document
        const gameData = {
          id: gameTag,
          name: gameTag.charAt(0).toUpperCase() + gameTag.slice(1), // Capitalize game name
          postCount: 1,
          players: 1,
          imageUrl: '', // Default empty for now
          trending: false,
          lastUpdated: new Date().toISOString()
        };
        await setDoc(gameRef, gameData);
      }
    } catch (error) {
      console.error('Error updating game popularity:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const combinedText = `${content.trim()} ${link.trim()}`.trim();

    if (!combinedText && !media) {
    setError('Los post no pueden estar vacíos');
    return;
    }

  
    if (!currentUser) {
      setError('Tienes que estar logueado para hacer un post');
      return;
    }
  
    try {
      setLoading(true);
      setError('');
  
      let mediaUrl = '';
      if (media) {
        mediaUrl = await uploadImageToImgbb(media);
      }
  
      if (link && !isValidUrl(link)) {
        setError('Please enter a valid URL');
        return;
      }

        let finalContent = content.trim();
        let finalLink = link.trim();

        const isLinkOnly = isValidUrl(finalContent) && !finalLink;

        if (isLinkOnly) {
          finalLink = finalContent;
          finalContent = '';
        }

        if (finalLink && finalContent.includes(finalLink)) {
          finalContent = finalContent.replace(finalLink, '').trim();
        }

        const isInappropriate = checkInappropriateContent(content);


        const postData = {
          content: finalContent,
          link: finalLink,
          mediaUrl,
          mediaType,
          authorId: currentUser.uid,
          timestamp: new Date().toISOString(),
          likes: [],
          comments: [],
          privacy,
          gameTag,
          shares: 0,
          type: mediaType || (finalLink ? 'link' : 'text'),
          flags: isInappropriate ? 1 : 0
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
  
      // Update game popularity if a game tag was selected
      if (gameTag) {
        await updateGamePopularity(gameTag);
      }

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
            bgcolor: 'background.paper'
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

          <Tooltip title="Add emoji">
            <IconButton
              color="primary"
              size="small"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <EmojiIcon2 />
            </IconButton>
          </Tooltip>
          {showEmojiPicker && (
            <Box
              ref={emojiPickerRef}
              sx={{
                position: 'absolute',
                zIndex: 1000,
                mt: 2,
                boxShadow: theme.shadows[8],
                borderRadius: 2,
                bgcolor: 'background.paper',
                '.EmojiPickerReact': {
                  border: 'none',
                  boxShadow: 'none',
                  '--epr-bg-color': 'transparent',
                  '--epr-category-label-bg-color': theme.palette.background.default
                }
              }}
            >
              <EmojiPicker
                onEmojiClick={(emojiObject) => {
                  setContent((prevContent) => prevContent + emojiObject.emoji);
                  setShowEmojiPicker(false);
                }}
                width={300}
                height={400}
              />
            </Box>
          )}

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
              <MenuItem value="valorant">Valorant</MenuItem>
              <MenuItem value="gta">GTA V</MenuItem>
              <MenuItem value="csgo">CS:GO</MenuItem>
              <MenuItem value="apex">Apex Legends</MenuItem>
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
