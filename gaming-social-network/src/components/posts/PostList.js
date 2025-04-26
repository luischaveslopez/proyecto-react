import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, query, where, orderBy, getDocs, doc, getDoc, limit, startAfter } from 'firebase/firestore';
import { Box, CircularProgress, Typography, Fade, useTheme } from '@mui/material';
import Post from './Post';
import { SentimentDissatisfied as SadIcon } from '@mui/icons-material';
import DeviceUnknownIcon from '@mui/icons-material/DeviceUnknown';

const POSTS_PER_PAGE = 5;

const PostList = ({ 
  posts = [], 
  loading = false, 
  userId = null,
  onDelete,
  onUpdate
}) => {
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef();
  const theme = useTheme();
  const currentUser = auth.currentUser;

  const lastPostElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        if (posts.length < POSTS_PER_PAGE) {
          setHasMore(false);
        }
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, posts.length]);

  if (loading) {
    return (
      <Fade in={true}>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      </Fade>
    );
  }

  if (error) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="200px"
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 3,
          textAlign: 'center'
        }}
      >
        <SadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography color="error" variant="h6" gutterBottom>
          Failed to load posts
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {error}
        </Typography>
      </Box>
    );
  }

  if (posts.length === 0) {
    return (
      <Fade in={true}>
        <Box 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center" 
          minHeight="200px"
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: 3,
            textAlign: 'center'
          }}
        >
          <DeviceUnknownIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.primary" gutterBottom>
            {userId ? 'No posts yet' : 'No posts available'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userId 
              ? 'Be the first to share something!' 
              : 'Follow some gamers to see their posts here'}
          </Typography>
        </Box>
      </Fade>
    );
  }

  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        position: 'relative'
      }}
    >
      {posts.map((post, index) => {
        if (posts.length === index + 1) {
          return (
            <Box ref={lastPostElementRef} key={post.id}>
              <Fade in={true}>
                <div>
                  <Post
                    post={post}
                    onDelete={() => onDelete && onDelete(post.id)}
                    onUpdate={() => onUpdate && onUpdate()}
                  />
                </div>
              </Fade>
            </Box>
          );
        } else {
          return (
            <Fade in={true} key={post.id}>
              <div>
                <Post
                  post={post}
                  onDelete={() => onDelete && onDelete(post.id)}
                  onUpdate={() => onUpdate && onUpdate()}
                />
              </div>
            </Fade>
          );
        }
      })}
      
      {loadingMore && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            p: 2 
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}

      {!hasMore && posts.length > POSTS_PER_PAGE && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          align="center"
          sx={{ py: 2 }}
        >
          No more posts to load
        </Typography>
      )}
    </Box>
  );
};

export default PostList;
