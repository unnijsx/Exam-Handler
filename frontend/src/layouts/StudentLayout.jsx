import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, useTheme, Container } from '@mui/material';
import { LightMode, DarkMode, ExitToApp, Timer } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useThemeToggle } from '../context/ThemeContext';
import { useExam } from '../context/ExamContext';
import { useNavigate } from 'react-router-dom';

const StudentLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { toggleTheme, mode } = useThemeToggle();
  const { timeRemaining, saveState } = useExam();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogout = async () => {
    // Save current progress before logout
    if (saveState) {
      await saveState();
    }
    logout();
    navigate('/login');
  };

  // Format time (seconds to HH:MM:SS)
  const formatTime = (seconds) => {
    if (seconds === null || isNaN(seconds)) return '00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
    ].join(':');
  };

  const isTimeUrgent = timeRemaining !== null && timeRemaining < 300; // less than 5 mins

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" color="inherit" elevation={1} sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3, md: 4 } }}>
          <Box>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              EvalAI Campus
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              AI & Machine Learning Assessment Platform
            </Typography>
          </Box>

          {user && user.examStatus !== 'completed' && timeRemaining !== null && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: isTimeUrgent ? 'error.light' : 'action.selected',
              color: isTimeUrgent ? 'error.contrastText' : 'text.primary',
              py: 0.5,
              px: 1.5,
              borderRadius: '20px',
              border: `1px solid ${isTimeUrgent ? theme.palette.error.main : theme.palette.divider}`,
              gap: 1
            }}>
              <Timer fontSize="small" color={isTimeUrgent ? 'inherit' : 'primary'} />
              <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                {formatTime(timeRemaining)}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user && (
              <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 500, mr: 1 }}>
                {user.fullName} ({user.email})
              </Typography>
            )}

            <IconButton onClick={toggleTheme} color="inherit" size="small">
              {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
            </IconButton>

            {user && (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<ExitToApp />}
                onClick={handleLogout}
                sx={{ ml: 1 }}
              >
                Exit Exam
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, py: { xs: 2, md: 4 }, bgcolor: 'background.default', px: { xs: 2, sm: 3, md: 4 } }}>
        {children}
      </Box>

      <Box component="footer" sx={{
        py: 3,
        mt: 'auto',
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        px: { xs: 2, sm: 3, md: 4 }
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            © 2026 All Rights Reserved | Developed by{' '}
            <a 
              href="https://www.unni.rheox.online" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: theme.palette.primary.main, textDecoration: 'none', fontWeight: 'bold' }}
            >
              Unni
            </a>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default StudentLayout;
