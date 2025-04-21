import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  Popper,
  Fade,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Tag as TagIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setSearchResults({ users: [], posts: [] });
      return;
    }

    setLoading(true);
    try {
      // Search users
      const usersQuery = query(
        collection(db, 'users'),
        where('searchTerms', 'array-contains', term.toLowerCase()),
        limit(5)
      );

      // Search posts
      const postsQuery = query(
        collection(db, 'posts'),
        where('hashtags', 'array-contains', term.toLowerCase()),
        orderBy('timestamp', 'desc'),
        limit(5)
      );

      const [usersSnapshot, postsSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(postsQuery)
      ]);

      setSearchResults({
        users: usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        posts: postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      });
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce(handleSearch, 300);

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    }
    return () => debouncedSearch.cancel();
  }, [searchTerm]);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setAnchorEl(event.currentTarget);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSearchResults({ users: [], posts: [] });
    setAnchorEl(null);
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    handleClear();
  };

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
    handleClear();
  };

  const open = Boolean(anchorEl) && (searchResults.users.length > 0 || searchResults.posts.length > 0);

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
      <TextField
        fullWidth
        value={searchTerm}
        onChange={handleInputChange}
        placeholder="Search users, posts, or hashtags..."
        variant="outlined"
        size="small"
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'transparent'
            },
            '&:hover fieldset': {
              borderColor: 'transparent'
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main
            }
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <IconButton size="small" onClick={handleClear}>
                  <ClearIcon />
                </IconButton>
              )}
            </InputAdornment>
          )
        }}
      />

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        transition
        sx={{ width: anchorEl?.clientWidth, zIndex: theme.zIndex.modal }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper 
              elevation={3}
              sx={{ 
                mt: 1,
                maxHeight: 400,
                overflow: 'auto',
                borderRadius: 2
              }}
            >
              {searchResults.users.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ p: 2, pb: 1 }}>
                    Users
                  </Typography>
                  <List dense>
                    {searchResults.users.map(user => (
                      <ListItem 
                        key={user.id}
                        button
                        onClick={() => handleUserClick(user.id)}
                        sx={{
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar src={user.photoURL}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.username}
                          secondary={user.email}
                          primaryTypographyProps={{
                            variant: 'subtitle2',
                            color: 'text.primary'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  {searchResults.posts.length > 0 && <Divider />}
                </>
              )}

              {searchResults.posts.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ p: 2, pb: 1 }}>
                    Posts
                  </Typography>
                  <List dense>
                    {searchResults.posts.map(post => (
                      <ListItem 
                        key={post.id}
                        button
                        onClick={() => handlePostClick(post.id)}
                        sx={{
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <ListItemText
                          primary={post.content.substring(0, 100) + '...'}
                          secondary={
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              {post.hashtags?.map(tag => (
                                <Chip
                                  key={tag}
                                  icon={<TagIcon />}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 24 }}
                                />
                              ))}
                            </Box>
                          }
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'text.primary'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Paper>
          </Fade>
        )}
      </Popper>
    </Box>
  );
};

export default SearchBar;
