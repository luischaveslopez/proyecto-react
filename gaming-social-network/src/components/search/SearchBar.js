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

const fetchUsersAndPosts = async (term) => {
  const lowerCaseTerm = term.toLowerCase();

  try {
    console.log('Fetching users, posts, and mail for term:', lowerCaseTerm);

    // Fetch users
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '>=', lowerCaseTerm),
      where('email', '<=', lowerCaseTerm + '\uf8ff')
    );
    console.log('Users query:', usersQuery);
    const usersSnapshot = await getDocs(usersQuery);
    console.log('Users snapshot:', usersSnapshot);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Fetched users:', users);

    // Fetch posts
    const postsQuery = query(
      collection(db, 'posts'),
      where('content', '>=', lowerCaseTerm),
      where('content', '<=', lowerCaseTerm + '\uf8ff')
    );
    console.log('Posts query:', postsQuery);
    const postsSnapshot = await getDocs(postsQuery);
    console.log('Posts snapshot:', postsSnapshot);
    const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Fetched posts:', posts);

    // Fetch games
    const gamesQuery = query(
      collection(db, 'games'),
      where('name', '>=', lowerCaseTerm),
      where('name', '<=', lowerCaseTerm + '\uf8ff')
    );
    console.log('Games query:', gamesQuery);
    const gamesSnapshot = await getDocs(gamesQuery);
    console.log('Games snapshot:', gamesSnapshot);
    const games = gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Fetched Games:', games);

    // Fetch mail
    const mailQuery = query(
      collection(db, 'mail'),
      where('username', '>=', lowerCaseTerm),
      where('username', '<=', lowerCaseTerm + '\uf8ff')
    );
    console.log('Mail query:', mailQuery);
    const mailSnapshot = await getDocs(mailQuery);
    console.log('Mail snapshot:', mailSnapshot);
    const mail = mailSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Fetched mail:', mail);

    return { users, posts, mail };
  } catch (error) {
    console.error('Error fetching users, posts, and mail:', error);
    throw error;
  }
};

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], mail: [] });
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setSearchResults({ users: [], posts: [], mail: [] });
      return;
    }

    setLoading(true);
    try {
      const results = await fetchUsersAndPosts(term);
      setSearchResults(results);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce(handleSearch, 300);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      debouncedSearch(searchTerm);
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setAnchorEl(event.currentTarget);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSearchResults({ users: [], posts: [], mail: [] });
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

  const handleMailClick = (mailId) => {
    navigate(`/mail/${mailId}`);
    handleClear();
  };

  const open = Boolean(anchorEl) && (searchResults.users.length > 0 || searchResults.posts.length > 0 || searchResults.mail.length > 0);

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
      <TextField
        fullWidth
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
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
                  {(searchResults.posts.length > 0 || searchResults.mail.length > 0) && <Divider />}
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
                  {searchResults.mail.length > 0 && <Divider />}
                </>
              )}

              {searchResults.mail.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ p: 2, pb: 1 }}>
                    Mail
                  </Typography>
                  <List dense>
                    {searchResults.mail.map(mail => (
                      <ListItem 
                        key={mail.id}
                        button
                        onClick={() => handleMailClick(mail.id)}
                        sx={{
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <ListItemText
                          primary={mail.username}
                          secondary={mail.subject}
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