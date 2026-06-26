import React, { useState, useEffect } from 'react';
import { Container, Card, CardContent, Typography, Box, Button, Grid, Divider, Paper, Stack, useTheme, Alert, CircularProgress, TextField } from '@mui/material';
import { CheckCircle, ExitToApp, AutoAwesome, EmojiEvents, School } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
 
const Completed = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
 
  const [result, setResult] = useState(null);
  const [loadingResult, setLoadingResult] = useState(true);
  const [fetchError, setFetchError] = useState(false);
 
  // Feedback states
  const [profile, setProfile] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
 
  const fetchProfile = async () => {
    try {
      const response = await api.get('/exam/profile');
      setProfile(response.data);
      if (response.data.feedback) {
        setFeedbackText(response.data.feedback);
      }
    } catch (err) {
      console.error('Failed to fetch student profile:', err);
    }
  };
 
  useEffect(() => {
    const fetchMyResult = async () => {
      try {
        const response = await api.get('/exam/my-result');
        setResult(response.data);
      } catch (err) {
        console.error('Results not published or fetch error:', err);
        setFetchError(true);
      } finally {
        setLoadingResult(false);
      }
    };
 
    fetchMyResult();
    fetchProfile();
  }, []);
 
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setSubmittingFeedback(true);
    try {
      await api.post('/exam/feedback', { feedback: feedbackText });
      setFeedbackSuccess('Feedback submitted successfully. Thank you!');
      await fetchProfile();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };
 
  const handleExit = () => {
    logout();
    navigate('/login');
  };
 
  if (loadingResult) {
    return (
      <Container maxWidth="xs" sx={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">Fetching published results profile...</Typography>
      </Container>
    );
  }
 
  // CASE 1: Results NOT published yet -> Render submission receipt with optional feedback form
  if (fetchError || !result) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Card sx={{ width: '100%', border: `1px solid ${theme.palette.divider}`, p: 4, textAlign: 'center' }}>
          <CardContent>
            <Box sx={{ color: 'success.main', mb: 3 }}>
              <CheckCircle sx={{ fontSize: 72 }} />
            </Box>
            
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
              Examination Completed
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              Thank you for participating. Your MCQ and Coding answers have been successfully uploaded and locked.
            </Typography>
 
            <Box sx={{
              bgcolor: 'action.selected',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              p: 2,
              my: 3,
              textAlign: 'left'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Submission Receipt
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Student Name:</strong> {user?.fullName || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                <strong>Registered Email:</strong> {user?.email || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                <strong>Submission Time:</strong> {new Date().toLocaleString()}
              </Typography>
            </Box>
 
            <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'bold', display: 'block', mb: 3 }}>
              Results are not published yet. Please wait for the admin to publish results.
            </Typography>
 
            {/* FEEDBACK SECTION */}
            <Card sx={{ border: `1px solid ${theme.palette.divider}`, textAlign: 'left', mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                  Provide Exam Feedback
                </Typography>
                {feedbackSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>{feedbackSuccess}</Alert>}
                {profile?.feedback ? (
                  <Box sx={{ p: 1.5, bgcolor: 'action.selected', borderRadius: '6px' }}>
                    <Typography variant="caption" color="text.secondary" display="block">Your Feedback:</Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                      "{profile.feedback}"
                    </Typography>
                  </Box>
                ) : (
                  <form onSubmit={handleFeedbackSubmit}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      Please share your feedback regarding questions, difficulty level, or general platform experience.
                    </Typography>
                    <TextField
                      multiline
                      rows={2}
                      fullWidth
                      variant="outlined"
                      size="small"
                      placeholder="Type your feedback here..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      disabled={submittingFeedback}
                      sx={{ mb: 1.5 }}
                      required
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      size="small"
                      disabled={submittingFeedback || !feedbackText.trim()}
                    >
                      {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
 
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<ExitToApp />}
              onClick={handleExit}
              sx={{ px: 4 }}
            >
              Exit Console
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }
 
  // CASE 2: Results ARE published
  const score = result.finalScore || 0;
  const hasSubmittedFeedback = !!(profile && profile.feedback);
 
  // CASE 2A: Student has NOT given feedback yet -> Show feedback gate card
  if (!hasSubmittedFeedback) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Card sx={{ width: '100%', border: `1px solid ${theme.palette.divider}`, p: 4, textAlign: 'center' }}>
          <CardContent>
            <Box sx={{ color: 'primary.main', mb: 3 }}>
              <School sx={{ fontSize: 72 }} />
            </Box>
            
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 800 }}>
              Your Results are Published!
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              To unlock and view your detailed score breakdown, grading report, and AI performance analysis, please submit your feedback regarding the exam experience first.
            </Typography>
 
            <Card sx={{ border: `1px solid ${theme.palette.divider}`, textAlign: 'left', mb: 4 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                  Provide Exam Feedback
                </Typography>
                {feedbackSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>{feedbackSuccess}</Alert>}
                <form onSubmit={handleFeedbackSubmit}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    Please share your feedback regarding questions difficulty, console performance, or instructions clarity.
                  </Typography>
                  <TextField
                    multiline
                    rows={3}
                    fullWidth
                    variant="outlined"
                    placeholder="Type your feedback here..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    disabled={submittingFeedback}
                    sx={{ mb: 2 }}
                    required
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    fullWidth
                    disabled={submittingFeedback || !feedbackText.trim()}
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback & View Results'}
                  </Button>
                </form>
              </CardContent>
            </Card>
 
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ExitToApp />}
              onClick={handleExit}
              fullWidth
            >
              Exit Console
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }
 
  // CASE 2B: Results published AND feedback submitted -> Render complete dashboard
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Grade Feedback Header */}
      {score > 70 ? (
        <Alert severity="success" icon={<EmojiEvents sx={{ fontSize: 28 }} />} sx={{ mb: 4, borderRadius: '12px', py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Warm Congratulations!</Typography>
          <Typography variant="body2">
            Warm Congratulations, <strong>{user?.fullName}</strong>! You have performed exceptionally well in this assessment with a score of {score}/100. Excellent work!
          </Typography>
        </Alert>
      ) : score < 50 ? (
        <Alert severity="info" icon={<School sx={{ fontSize: 28 }} />} sx={{ mb: 4, borderRadius: '12px', py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Exam Results Published</Typography>
          <Typography variant="body2">
            Hello, <strong>{user?.fullName}</strong>. Your exam results have been published. Please review your detailed score breakdown and AI feedback report below.
          </Typography>
        </Alert>
      ) : (
        <Alert severity="success" icon={<CheckCircle sx={{ fontSize: 28 }} />} sx={{ mb: 4, borderRadius: '12px', py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Congratulations!</Typography>
          <Typography variant="body2">
            Congratulations, <strong>{user?.fullName}</strong>! You have successfully completed and passed the assessment with a score of {score}/100. Good job!
          </Typography>
        </Alert>
      )}
 
      {/* Main Scorecard */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2.5, textAlign: 'center', height: '100%', borderRadius: '10px' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 'bold', mb: 1 }}>MCQ SECTION</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{result.mcqScore} / 50</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2.5, textAlign: 'center', height: '100%', borderRadius: '10px' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 'bold', mb: 1 }}>PRACTICAL CODING</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{result.codingScore} / 50</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2.5, textAlign: 'center', height: '100%', bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: '10px' }}>
            <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', mb: 1 }}>FINAL ASSESSMENT GRADE</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900 }}>{score} / 100</Typography>
          </Paper>
        </Grid>
      </Grid>
 
      {/* detailed AI Analysis Breakout */}
      <Card sx={{ mb: 4, borderRadius: '12px' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome color="primary" /> Detailed AI Evaluation Breakdown
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '8px', borderLeft: '4px solid #3B82F6' }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 'bold' }}>Code Quality</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5 }}>{result.aiEvaluation?.codeQualityScore ?? 0} / 12.5</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 'bold' }}>Dataset Handling</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5 }}>{result.aiEvaluation?.datasetHandlingScore ?? 0} / 12.5</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '8px', borderLeft: '4px solid #F59E0B' }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 'bold' }}>CNN Construction</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5 }}>{result.aiEvaluation?.cnnImplementationScore ?? 0} / 12.5</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '8px', borderLeft: '4px solid #EF4444' }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 'bold' }}>Output Quality</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5 }}>{result.aiEvaluation?.outputQualityScore ?? 0} / 12.5</Typography>
              </Box>
            </Grid>
          </Grid>
 
          <Divider sx={{ my: 2.5 }} />
 
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5 }}>
            Gemini Evaluator Summary Feedback:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: '8px' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.875rem' }}>
              {result.aiEvaluation?.overallSummary || 'No summary feedback provided.'}
            </Typography>
          </Paper>
        </CardContent>
      </Card>
 
      {/* FEEDBACK SECTION IN RESULTS VIEW */}
      <Card sx={{ mb: 4, borderRadius: '12px' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5 }}>
            Your Exam Feedback
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'action.selected', borderRadius: '8px' }}>
            <Typography variant="caption" color="text.secondary" display="block">Submitted Feedback:</Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5, whiteSpace: 'pre-wrap' }}>
              "{profile?.feedback || 'N/A'}"
            </Typography>
          </Box>
        </CardContent>
      </Card>
 
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<ExitToApp />}
          onClick={handleExit}
          sx={{ px: 5, py: 1.5, borderRadius: '8px', fontWeight: 'bold' }}
        >
          Exit Assessment Console
        </Button>
      </Box>
    </Container>
  );
};
 
export default Completed;
