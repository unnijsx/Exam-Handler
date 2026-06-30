import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Grid, Typography, Button, TextField, Divider, Alert, CircularProgress, Paper, Chip, Stack, useTheme } from '@mui/material';
import { ArrowBack, AutoAwesome, Check, Download, Image, Code } from '@mui/icons-material';
import api from '../../services/api';

const StudentReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // AI Evaluation triggered states
  const [evaluating, setEvaluating] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState('');

  // Manual marking override state
  const [manualCodingScore, setManualCodingScore] = useState('');
  const [manualMcqScore, setManualMcqScore] = useState('');
  const [overriding, setOverriding] = useState(false);

  const fetchStudentDetails = async () => {
    try {
      const response = await api.get(`/students/${id}`);
      setData(response.data);
      if (response.data.student.codingScore !== null) {
        setManualCodingScore(response.data.student.codingScore.toString());
      }
      if (response.data.student.mcqScore !== null) {
        setManualMcqScore(response.data.student.mcqScore.toString());
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load student exam details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDetails();
  }, [id]);

  const handleAiEvaluate = async () => {
    setEvaluating(true);
    setEvalSuccess('');
    setErrorMsg('');
    try {
      const response = await api.post(`/evaluations/${id}/evaluate`);
      setEvalSuccess('AI Evaluation completed successfully by Google Gemini.');
      // Refresh student details
      await fetchStudentDetails();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gemini AI evaluation failed. Check backend console logs.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleOverrideScoreSubmit = async () => {
    const payload = {};
    if (manualCodingScore !== '') {
      if (isNaN(manualCodingScore)) {
        setErrorMsg('Please enter a valid numeric grade for coding.');
        return;
      }
      payload.codingScore = Number(manualCodingScore);
    }
    if (manualMcqScore !== '') {
      if (isNaN(manualMcqScore)) {
        setErrorMsg('Please enter a valid numeric grade for MCQ.');
        return;
      }
      payload.mcqScore = Number(manualMcqScore);
    }

    if (Object.keys(payload).length === 0) {
      setErrorMsg('Please enter at least one score to update.');
      return;
    }

    setOverriding(true);
    setErrorMsg('');
    try {
      await api.post(`/evaluations/${id}/override`, payload);
      setEvalSuccess('Student scores successfully updated.');
      await fetchStudentDetails();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Score override failed.');
    } finally {
      setOverriding(false);
    }
  };

  const handleTogglePause = async () => {
    if (!data?.session) return;
    setErrorMsg('');
    setEvalSuccess('');
    try {
      await api.post(`/students/${id}/pause-toggle`);
      setEvalSuccess(`Exam session successfully ${data.session.isPaused ? 'resumed' : 'paused'}.`);
      await fetchStudentDetails();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to toggle pause status.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading student submission profile...</Typography>
      </Box>
    );
  }

  if (errorMsg && !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{errorMsg}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin/students')} sx={{ mt: 2 }}>
          Back to Students
        </Button>
      </Box>
    );
  }

  const { student, session, submission, result } = data;
  const webBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const token = localStorage.getItem('token');

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin/students')} sx={{ mb: 3 }}>
        Back to Students
      </Button>

      {evalSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }}>
          {evalSuccess}
        </Alert>
      )}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {errorMsg}
        </Alert>
      )}

      {/* Header Info Panel */}
      <Card sx={{ mb: 4, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {student.fullName}
              </Typography>
              {(student.examStatus === 'mcq_in_progress' || student.examStatus === 'coding_in_progress') && session && (
                <Button
                  variant="outlined"
                  color={session.isPaused ? 'success' : 'warning'}
                  size="small"
                  onClick={handleTogglePause}
                  sx={{ fontWeight: 'bold', borderRadius: '20px' }}
                >
                  {session.isPaused ? 'Resume Exam' : 'Pause Exam'}
                </Button>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Email: {student.email} | Assigned Animals: {student.assignedClasses.join(', ') || 'None'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
            <Stack direction="row" spacing={1.5} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Paper variant="outlined" sx={{ px: 2, py: 1, textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary" display="block">MCQ</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{student.mcqScore !== null ? student.mcqScore : '-'} / 50</Typography>
              </Paper>
              <Paper variant="outlined" sx={{ px: 2, py: 1, textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary" display="block">Coding</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{student.codingScore !== null ? student.codingScore : '-'} / 50</Typography>
              </Paper>
              <Paper variant="outlined" sx={{ px: 2, py: 1, bgcolor: 'primary.light', color: 'primary.contrastText', textAlign: 'center', minWidth: 100 }}>
                <Typography variant="caption" display="block">Final Grade</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{student.finalScore !== null ? student.finalScore : '-'} / 100</Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Card>
 
      {student.feedback && (
        <Alert severity="info" sx={{ mb: 4, borderRadius: '8px' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Submitted Student Feedback:
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
            "{student.feedback}"
          </Typography>
        </Alert>
      )}

      {/* Submission details */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Left column: Submitted files, editor code, screenshots */}
        <Grid item xs={12} md={7} lg={7.5}>
          {/* Main code viewer */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Code /> Submitted CNN Code
                </Typography>
                
                {/* Download links */}
                <Stack direction="row" spacing={1}>
                  {submission?.codeFileUrl && (
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => window.open(`${submission.codeFileUrl}?token=${token}`, '_blank')}
                      variant="outlined"
                    >
                      Download Script
                    </Button>
                  )}
                  {submission?.ptFileUrl && (
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => window.open(`${submission.ptFileUrl}?token=${token}`, '_blank')}
                      variant="outlined"
                      color="secondary"
                    >
                      Download Weights (.pt)
                    </Button>
                  )}
                </Stack>
              </Box>

              {submission ? (
                <TextField
                  multiline
                  rows={14}
                  fullWidth
                  variant="outlined"
                  value={submission.codeContent || 'No inline code pasted. (Script file uploaded instead)'}
                  InputProps={{
                    readOnly: true,
                    style: { fontFamily: 'monospace', fontSize: '0.85rem', bgcolor: theme.palette.action.hover }
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No coding exam files uploaded yet. (Exam in progress / not started)
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Screenshots Display Grid */}
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Image /> Submitted Screenshots
              </Typography>

              {submission ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, textAlign: 'center' }}>
                      1. Epoch Outputs
                    </Typography>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden' }}>
                      <img
                        src={`${submission.screenshotTrainingUrl}`}
                        alt="Training epoch screenshots"
                        style={{ width: '100%', height: '140px', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => window.open(`${submission.screenshotTrainingUrl}`, '_blank')}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, textAlign: 'center' }}>
                      2. Accuracy Curves
                    </Typography>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden' }}>
                      <img
                        src={`${submission.screenshotAccuracyUrl}`}
                        alt="Accuracy curve curves"
                        style={{ width: '100%', height: '140px', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => window.open(`${submission.screenshotAccuracyUrl}`, '_blank')}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, textAlign: 'center' }}>
                      3. Prediction Labels
                    </Typography>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden' }}>
                      <img
                        src={`${submission.screenshotPredictionUrl}`}
                        alt="Predictions outputs validation"
                        style={{ width: '100%', height: '140px', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => window.open(`${submission.screenshotPredictionUrl}`, '_blank')}
                      />
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No screenshots uploaded.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: AI details & manual override */}
        <Grid item xs={12} md={5} lg={4.5}>
          {/* AI grading card */}
          <Card sx={{ mb: 4, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoAwesome color="primary" /> Gemini AI Reviewer
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={evaluating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
                  onClick={handleAiEvaluate}
                  disabled={evaluating || !submission}
                >
                  {evaluating ? 'Reviewing...' : 'AI Review'}
                </Button>
              </Box>

              <Divider sx={{ mb: 2.5 }} />

              {/* Sub-scores breakout */}
              {result && result.aiEvaluation && result.aiEvaluation.overallSummary ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                    Breakout Sub-scores:
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">Code Quality</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{result.aiEvaluation.codeQualityScore} / 12.5</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">Dataset Handling</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{result.aiEvaluation.datasetHandlingScore} / 12.5</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">CNN Implementation</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{result.aiEvaluation.cnnImplementationScore} / 12.5</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">Output Quality</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{result.aiEvaluation.outputQualityScore} / 12.5</Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ p: 1.5, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: '6px', mb: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Suggested AI Score: {result.aiEvaluation.suggestedScore} / 50
                    </Typography>
                  </Box>

                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Detailed Model Feedback:
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: '250px', overflowY: 'auto', bgcolor: 'action.hover' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', lineHeight: 1.6 }}>
                      {result.aiEvaluation.overallSummary}
                    </Typography>
                  </Paper>
                </Box>
              ) : (
                <Alert severity="info" sx={{ borderRadius: '8px' }}>
                  No AI evaluation details available. Click the <strong>AI Review</strong> button above to request Google Gemini to evaluate the submissions.
                </Alert>
              )}
            </CardContent>
          </Card>
 
          {/* Manual Marking / Grading overwrite card */}
          <Card sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                Manual Marking Overrides
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                As an instructor, you can override and edit the student's MCQ and coding scores. The final aggregate grade will automatically recalculate.
              </Typography>
 
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Manual MCQ Score (Max 50)"
                    type="number"
                    fullWidth
                    size="small"
                    value={manualMcqScore}
                    onChange={(e) => setManualMcqScore(e.target.value)}
                    disabled={overriding}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Manual Coding Score (Max 50)"
                    type="number"
                    fullWidth
                    size="small"
                    value={manualCodingScore}
                    onChange={(e) => setManualCodingScore(e.target.value)}
                    disabled={overriding}
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                color="secondary"
                fullWidth
                startIcon={<Check />}
                onClick={handleOverrideScoreSubmit}
                disabled={overriding || (manualCodingScore === '' && manualMcqScore === '')}
              >
                {overriding ? 'Updating Scores...' : 'Apply & Save Scores'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentReview;
