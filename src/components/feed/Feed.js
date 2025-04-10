import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/config';
import { collection, query, where, orderBy, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import {
  Container,
  Grid,
  Box,
  useTheme,
  useMediaQuery,
  Paper,
  Fab,
  Zoom,
  Drawer
} from '@mui/material';
import {
  KeyboardArrowUp as ScrollTopIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import CreatePost from '../posts/CreatePost';
import PostList from '../posts/PostList';
import DiscoverySidebar from '../discovery/DiscoverySidebar';
import SearchBar from '../search/SearchBar';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentUser = auth.currentUser;

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let unsubscribe;

    const setupPostsListener = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : { following: [], friends: [] };
        
        const relevantUsers = [...new Set([
          ...(userData.following || []),
          ...(userData.friends || []),
          currentUser.uid
        ])];

        const postsQuery = query(
          collection(db, 'posts'),
          where('authorId', 'in', relevantUsers),
          orderBy('timestamp', 'desc')
        );

        unsubscribe = onSnapshot(postsQuery, (snapshot) => {
          const fetchedPosts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPosts(fetchedPosts);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching posts:', error);
          setLoading(false);
        });

      } catch (error) {
        console.error('Error setting up posts listener:', error);
        setLoading(false);
      }
    };

    setupPostsListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  const handleScrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        pt: { xs: 8, sm: 9 },
        pb: 4
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* Main Feed */}
          <Grid 
            item 
            xs={12} 
            md={8}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}
          >
            <Paper 
              sx={{ 
                p: 2,
                borderRadius: 2,
                boxShadow: theme.shadows[2]
              }}
            >
              <CreatePost />
            </Paper>
            
            <PostList 
              posts={posts}
              loading={loading}
            />
          </Grid>

          {/* Discovery Sidebar - Hidden on mobile */}
          {!isMobile && (
            <Grid item md={4}>
              <Box 
                sx={{ 
                  position: 'sticky',
                  top: 88,
                  maxHeight: 'calc(100vh - 100px)',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px'
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: 'background.paper'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'action.hover',
                    borderRadius: '4px'
                  }
                }}
              >
                <DiscoverySidebar />
              </Box>
            </Grid>
          )}
        </Grid>
      </Container>

      {/* Mobile Search FAB */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="search"
          onClick={() => setMobileSearchOpen(true)}
          sx={{
            position: 'fixed',
            bottom: theme.spacing(2),
            left: theme.spacing(2)
          }}
        >
          <SearchIcon />
        </Fab>
      )}

      {/* Mobile Search Drawer */}
      <Drawer
        anchor="bottom"
        open={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '80vh'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <SearchBar />
          <DiscoverySidebar />
        </Box>
      </Drawer>

      {/* Scroll to Top Button */}
      <Zoom in={showScrollTop}>
        <Fab
          color="primary"
          size="small"
          aria-label="scroll back to top"
          onClick={handleScrollTop}
          sx={{
            position: 'fixed',
            bottom: theme.spacing(2),
            right: theme.spacing(2)
          }}
        >
          <ScrollTopIcon />
        </Fab>
      </Zoom>
    </Box>
  );
};

export default Feed;
