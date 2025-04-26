import React, { useState } from 'react';
import { auth } from '../../firebase/config';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { TextField, Button, Paper, Typography, Container, Box, Switch, FormControlLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ensureUserDocumentExists } from '../../firebase/userService';
import GoogleIcon from '@mui/icons-material/Google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDocumentExists(result.user);
      // Check if it's admin login
      if (email === 'admin@gmail.com') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await ensureUserDocumentExists(user);
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={6} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          {isAdminMode ? 'Admin Login' : 'Sign in'}
        </Typography>
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email Address"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <FormControlLabel
            control={
              <Switch
                checked={isAdminMode}
                onChange={(e) => {
                  setIsAdminMode(e.target.checked);
                  if (e.target.checked) {
                    setEmail('');
                    setPassword('');
                  } else {
                    setEmail('');
                    setPassword('');
                  }
                }}
              />
            }
            label="Admin Login"
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            color={isAdminMode ? "secondary" : "primary"}
          >
            {isAdminMode ? 'Login as Admin' : 'Sign In'}
          </Button>
          {!isAdminMode && (
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleLogin}
              sx={{ mb: 2, color: 'primary.main', borderColor: 'primary.main', '& .MuiButton-startIcon': { color: 'white' } }}
              startIcon={<GoogleIcon />}
            >
              Sign In with Google
            </Button>
          )}
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/register')}
          >
            Don't have an account? Sign Up
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/reset-password')}
          >
            Forgot password?
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
