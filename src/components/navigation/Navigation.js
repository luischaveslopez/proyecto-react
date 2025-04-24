import { useState } from 'react';
import { AppBar, Box, Button, Container, Toolbar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navigation = () => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  return (
    <AppBar position="fixed" sx={{ bgcolor: 'background.paper', borderBottom: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1, sm: 2 } }}>
          {/* ...existing code... */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              component={RouterLink}
              to="/login"
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Login
            </Button>
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/register"
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Register
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={toggleTheme}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                bgcolor: 'secondary.main',
                color: 'white',
                ml: 1, // Add margin to the left to separate it from the Register button
                '&:hover': {
                  bgcolor: 'secondary.dark'
                },
                zIndex: 1 // Ensure the button is above other elements
              }}
            >
              Toggle Theme
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation;