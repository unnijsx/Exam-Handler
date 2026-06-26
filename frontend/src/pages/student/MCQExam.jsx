import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, FormControl, Button, LinearProgress, Divider, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Paper, Container, Stack, Chip, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight, BookmarkBorder, Bookmark, CheckCircle, Warning } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useExam } from '../../context/ExamContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MCQExam = () => {
  const { user } = useAuth();
  const {
    session,
    loading,
    answers,
    currentIdx,
    selectOption,
    navigateToQuestion,
    submitMCQ,
    startExam,
    requestPause,
  } = useExam();

  const navigate = useNavigate();
  const [reviewList, setReviewList] = useState([]);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleRequestPause = async () => {
    try {
      await requestPause();
    } catch (err) {
      console.error(err);
    }
  };

  // States for Rules Screen start triggers
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  // Recover review marks from localStorage
  useEffect(() => {
    if (user?._id) {
      const stored = localStorage.getItem(`review_${user._id}`);
      if (stored) {
        setReviewList(JSON.parse(stored));
      }
    }
  }, [user]);

  if (loading || !session) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
        <LinearProgress sx={{ width: '200px' }} />
        <Typography variant="body2" color="text.secondary">Loading examination console...</Typography>
      </Box>
    );
  }

  // If exam has not started yet, show Rules Screen
  if (!session.examStarted) {
    const handleStartExamConfirm = async () => {
      setStartConfirmOpen(false);
      setStarting(true);
      setStartError('');
      try {
        await startExam();
      } catch (err) {
        setStartError(err.message || 'Failed to start exam.');
        setStarting(false);
      }
    };

    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        {startError && <Alert severity="error" sx={{ mb: 3 }}>{startError}</Alert>}
        <Card sx={{ p: 2, borderLeft: '6px solid #2563EB' }}>
          <CardContent>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 800, mb: 1.5 }}>
              EvalAI Campus Examination Rules
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3, color: 'text.secondary' }}>
              Please read the following instructions carefully before starting the exam.
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2.5} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircle color="primary" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Phase 1: MCQ Examination</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration: <strong>2 Hours</strong>. Consists of <strong>50 Questions</strong> covering Python, Pandas, NumPy, neural networks, and ML theories. Questions and option arrangements are randomized for each student.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircle color="primary" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Phase 2: Coding CNN Practical</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration: <strong>3 Hours</strong>. You will be assigned 3 random animal categories to train a CNN classifier locally and submit script files along with 3 required screenshots.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircle color="primary" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Autosave & Recovery Protection</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your selections and remaining time are saved automatically every <strong>5 seconds</strong>. If your browser refreshes, computer restarts, or internet fails, you can log back in immediately to resume from where you left off.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Warning color="error" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'error.main' }}>Timer Persistence Warning</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Once started, the exam clock cannot be paused. Closing the browser tab or logging out will NOT stop the exam timer. Make sure you complete the exam in one continuous sitting.
                  </Typography>
                </Box>
              </Box>
            </Stack>

            <Divider sx={{ mb: 4 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                disabled={starting}
                onClick={() => setStartConfirmOpen(true)}
                sx={{ px: 5, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
              >
                {starting ? 'Initializing Exam...' : 'Start Examination'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Start Exam Confirm Dialog */}
        <Dialog open={startConfirmOpen} onClose={() => setStartConfirmOpen(false)}>
          <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" /> Confirm Examination Start
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you ready to begin? Your 5-hour exam timer (2 hours for MCQ, 3 hours for coding) will start ticking immediately. You cannot pause the exam once initiated.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setStartConfirmOpen(false)} variant="outlined">Cancel</Button>
            <Button onClick={handleStartExamConfirm} variant="contained" color="primary" autoFocus>
              Yes, Start Now
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  const questions = session.mcqQuestions || [];
  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;
  
  if (totalQuestions === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No questions found in this examination session.</Alert>
      </Box>
    );
  }

  // Answer states
  const selectedAnswer = answers[currentQuestion._id] || '';
  const answeredCount = Object.keys(answers).filter(key => answers[key] !== '').length;
  const progressPercent = (answeredCount / totalQuestions) * 100;

  const handleOptionChange = (e) => {
    selectOption(currentQuestion._id, e.target.value);
  };

  const handleToggleReview = () => {
    const qId = currentQuestion._id;
    let updated;
    if (reviewList.includes(qId)) {
      updated = reviewList.filter(id => id !== qId);
    } else {
      updated = [...reviewList, qId];
    }
    setReviewList(updated);
    if (user?._id) {
      localStorage.setItem(`review_${user._id}`, JSON.stringify(updated));
    }
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      navigateToQuestion(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      navigateToQuestion(currentIdx - 1);
    }
  };

  // Final MCQ submit action
  const handleMCQSubmit = async () => {
    setSubmitDialogOpen(false);
    setSubmitting(true);
    setSubmitError('');
    try {
      if (user?._id) {
        localStorage.removeItem(`review_${user._id}`);
      }
      await submitMCQ();
      navigate('/exam/coding');
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  // Map shuffled options relative to indices
  const currentShuffledOptions = session.mcqOptionsShuffled?.[currentIdx] || currentQuestion.options;

  const renderPaletteContent = () => {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
          Question Palette
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: { xs: 0.5, sm: 1 }, 
          maxHeight: { xs: 'calc(100vh - 250px)', md: '350px' }, 
          overflowY: 'auto', 
          p: 0.5, 
          mb: 3 
        }}>
          {questions.map((q, idx) => {
            const isAnswered = answers[q._id] && answers[q._id] !== '';
            const isReview = reviewList.includes(q._id);
            const isCurrent = idx === currentIdx;

            let btnBg = 'transparent';
            let btnColor = 'text.secondary';
            let borderStyle = '1px solid';
            let borderColor = 'divider';

            if (isAnswered) {
              btnBg = 'success.light';
              btnColor = 'success.contrastText';
              borderColor = 'success.main';
            }
            if (isReview) {
              btnBg = 'warning.light';
              btnColor = 'warning.contrastText';
              borderColor = 'warning.main';
            }
            if (isCurrent) {
              borderStyle = '2px solid';
              borderColor = 'primary.main';
              if (!isAnswered && !isReview) {
                btnColor = 'primary.main';
              }
            }

            return (
              <Button
                key={q._id}
                variant={isAnswered || isReview ? 'contained' : 'outlined'}
                onClick={() => navigateToQuestion(idx)}
                sx={{
                  minWidth: { xs: 28, sm: 36, md: 42 },
                  height: { xs: 28, sm: 36, md: 42 },
                  p: 0,
                  borderRadius: '8px',
                  bgcolor: isAnswered || isReview ? btnBg : 'transparent',
                  color: btnColor,
                  border: borderStyle,
                  borderColor: borderColor,
                  fontWeight: 700,
                  fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.85rem' },
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isCurrent ? 'action.hover' : btnBg,
                    borderColor: 'primary.main',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                {idx + 1}
              </Button>
            );
          })}
        </Box>

        <Divider sx={{ mb: 2, display: { xs: 'none', sm: 'block' } }} />

        <Typography variant="caption" sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'block' }, mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Legend
        </Typography>
        <Grid container spacing={1.5} sx={{ display: { xs: 'none', sm: 'flex' }, mb: 2 }}>
          <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 14, height: 14, bgcolor: 'success.light', border: '1px solid', borderColor: 'success.main', borderRadius: '4px' }} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>Answered</Typography>
          </Grid>
          <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 14, height: 14, bgcolor: 'warning.light', border: '1px solid', borderColor: 'warning.main', borderRadius: '4px' }} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>Review Later</Typography>
          </Grid>
          <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 14, height: 14, border: '1px solid', borderColor: 'divider', borderRadius: '4px' }} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>Unanswered</Typography>
          </Grid>
          <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 14, height: 14, border: '2px solid', borderColor: 'primary.main', borderRadius: '4px' }} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>Current Active</Typography>
          </Grid>
        </Grid>

        <Button
          variant="outlined"
          color="warning"
          size="small"
          fullWidth
          disabled={!!session.pauseRequested || !!session.isPaused}
          onClick={handleRequestPause}
          sx={{ mt: 'auto', py: 1, fontWeight: 'bold', textTransform: 'none', borderRadius: '8px' }}
        >
          {session.isPaused 
            ? 'Exam Paused' 
            : session.pauseRequested 
              ? 'Pause Requested...' 
              : 'Request Pause'}
        </Button>
      </Box>
    );
  };

  const theme = useTheme();

  return (
    <Container maxWidth="lg" disableGutters sx={{ px: 0 }}>
      <Box sx={{ flexGrow: 1 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
            {submitError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2, md: 3 }, flexDirection: 'row', alignItems: 'flex-start' }}>
          {/* Left Side: Question Display */}
          <Box sx={{ width: { xs: '68%', sm: '70%', md: '72%' }, flexShrink: 0 }}>
            {/* Active Question Card */}
            <Card sx={{ width: '100%', minHeight: '350px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{ height: 6, bg: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)' }} />
              
              {/* Integrated Compact Progress Bar */}
              <Box sx={{ px: 2.5, pt: 1.5, pb: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Exam Progress: {answeredCount} / {totalQuestions} Answered
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                    {Math.round(progressPercent)}% Complete
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 4, borderRadius: 2 }} />
              </Box>

              <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 2.5 }, pt: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={`Topic: ${currentQuestion.topic}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 'bold', borderRadius: '6px' }}
                  />
                  <Button
                    size="small"
                    startIcon={reviewList.includes(currentQuestion._id) ? <Bookmark color="warning" /> : <BookmarkBorder />}
                    onClick={handleToggleReview}
                    color={reviewList.includes(currentQuestion._id) ? 'warning' : 'inherit'}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    {reviewList.includes(currentQuestion._id) ? 'Review Marked' : 'Review Later'}
                  </Button>
                </Box>

                <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700, lineHeight: 1.35, color: 'text.primary' }}>
                  Question {currentIdx + 1}: {currentQuestion.questionText}
                </Typography>

                <FormControl component="fieldset" fullWidth>
                  <Stack spacing={1.25}>
                    {currentShuffledOptions.map((opt, i) => {
                      const isSelected = selectedAnswer === opt;
                      return (
                        <Paper
                          key={i}
                          variant="outlined"
                          onClick={() => selectOption(currentQuestion._id, opt)}
                          sx={{
                            p: 1.5,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            border: isSelected ? '2px solid' : '1px solid',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'background.paper',
                            boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.1)' : 'none',
                            transition: 'all 0.15s ease-in-out',
                            '&:hover': {
                              borderColor: isSelected ? 'primary.main' : 'primary.light',
                              bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'action.hover',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
                            }
                          }}
                        >
                          <Box sx={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            bgcolor: isSelected ? 'primary.main' : 'action.selected',
                            color: isSelected ? 'primary.contrastText' : 'text.secondary',
                            border: '1px solid',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            transition: 'all 0.15s ease',
                            flexShrink: 0,
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                          }}>
                            {String.fromCharCode(65 + i)}
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                            {opt}
                          </Typography>
                        </Paper>
                      );
                    })}
                  </Stack>
                </FormControl>
              </CardContent>

              <Divider />
              
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', bgcolor: 'action.hover', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ChevronLeft />}
                  disabled={currentIdx === 0}
                  onClick={handlePrev}
                  sx={{ fontWeight: 'bold' }}
                >
                  Previous
                </Button>

                {currentIdx === totalQuestions - 1 ? (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => setSubmitDialogOpen(true)}
                    startIcon={<CheckCircle />}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Submit MCQ Exam
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    endIcon={<ChevronRight />}
                    onClick={handleNext}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Next Question
                  </Button>
                )}
              </Box>
            </Card>
          </Box>

          {/* Right Side: Question Palette */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Card sx={{ width: '100%', p: { xs: 1.5, sm: 2 }, minHeight: '350px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {renderPaletteContent()}
            </Card>
          </Box>
        </Box>

        {/* Confirmation Submit Dialog */}
        <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" /> Confirm Phase Submission
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              You have answered {answeredCount} out of {totalQuestions} questions. 
              Once you submit, your MCQ exam section will be locked, and you will move directly to the Coding Examination. 
              Are you sure you want to proceed?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSubmitDialogOpen(false)} variant="outlined">
              Cancel
            </Button>
            <Button onClick={handleMCQSubmit} variant="contained" color="success" autoFocus>
              Yes, Submit & Proceed
            </Button>
          </DialogActions>
        </Dialog>

        {/* Pause Overlay */}
        <Dialog
          open={!!session?.isPaused}
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.error.main}`,
              p: 3,
              textAlign: 'center',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
            }
          }}
          disableEscapeKeyDown
        >
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Warning color="error" sx={{ fontSize: 60 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'error.main' }}>
              Examination Paused
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your examination has been temporarily paused by the administrator.
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold', mt: 1 }}>
              The clock has stopped. You will be able to resume as soon as the admin resumes the session.
            </Typography>
          </DialogContent>
        </Dialog>
      </Box>
    </Container>
  );
};

export default MCQExam;
