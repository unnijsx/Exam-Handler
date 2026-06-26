import React, { useState } from 'react';
import { Container, Card, CardContent, TextField, Button, Typography, Box, Alert, CircularProgress, useTheme } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowForward } from '@mui/icons-material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginStudent } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const studentData = await loginStudent(email);
      if (studentData.examStatus === 'mcq_in_progress') {
        navigate('/exam/mcq');
      } else if (studentData.examStatus === 'coding_in_progress') {
        navigate('/exam/coding');
      } else {
        navigate('/exam/completed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ width: '100%', border: `1px solid ${theme.palette.divider}`, p: 2 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>
              Welcome to EvalAI Campus
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              AI & Machine Learning Assessment Platform
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., student@university.edu"
              disabled={loading}
              sx={{ mb: 3 }}
              required
            />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Verifying access...' : 'Access Examination'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login;
