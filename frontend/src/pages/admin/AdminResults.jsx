import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, LinearProgress, Stack, TextField, InputAdornment, useTheme, CircularProgress, Tooltip, Grid, Divider } from '@mui/material';
import { FileDownload, Print, Search, PictureAsPdf, Check, Warning } from '@mui/icons-material';
import api from '../../services/api';

const AdminResults = () => {
  const theme = useTheme();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [published, setPublished] = useState(false);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await api.get('/results');
      setResults(response.data);
    } catch (err) {
      console.error('Failed to load results data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublishStatus = async () => {
    try {
      const response = await api.get('/results/publish-status');
      setPublished(response.data.resultsPublished);
    } catch (err) {
      console.error('Failed to load publish status:', err);
    }
  };

  const handleTogglePublish = async () => {
    try {
      const response = await api.post('/results/publish-toggle');
      setPublished(response.data.resultsPublished);
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  useEffect(() => {
    fetchResults();
    fetchPublishStatus();
  }, []);

  // Filter list locally
  const filteredResults = results.filter((r) => {
    const s = r.studentId;
    if (!s) return false;
    return s.fullName.toLowerCase().includes(search.toLowerCase()) ||
           s.email.toLowerCase().includes(search.toLowerCase());
  });

  // Secure Blob Downloads
  const downloadReport = async (url, filename) => {
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleExportExcel = () => {
    downloadReport('/reports/excel', 'EvalAI_Campus_Results.xlsx');
  };

  const handleExportPdfBook = () => {
    downloadReport('/reports/pdf-book', 'EvalAI_Campus_General_Report.pdf');
  };

  const handlePrintMarksheet = (studentId, studentName) => {
    const sanitizedName = studentName.replace(/\s+/g, '_');
    downloadReport(`/reports/marksheet/${studentId}`, `Marksheet_${sanitizedName}.pdf`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Results & Reports Panel
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" color="primary" startIcon={<FileDownload />} onClick={handleExportExcel}>
            Download Excel
          </Button>
          <Button variant="outlined" color="secondary" startIcon={<PictureAsPdf />} onClick={handleExportPdfBook}>
            Download PDF Book
          </Button>
          <Button
            variant={published ? "contained" : "outlined"}
            color={published ? "success" : "warning"}
            startIcon={published ? <Check /> : <Warning />}
            onClick={handleTogglePublish}
            sx={{ fontWeight: 'bold' }}
          >
            {published ? "Results Published" : "Publish Results"}
          </Button>
        </Stack>
      </Box>

      {/* Local search filter */}
      <Card sx={{ p: 2, mb: 3 }}>
        <TextField
          label="Search Student Results"
          variant="outlined"
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter results by student name or email..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Card>

      {/* Results details table */}
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email Address</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>MCQ Score (50)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Coding Score (50)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Final Score (100)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Graded By</TableCell>
              <TableCell sx={{ fontWeight: 'bold', align: 'center' }}>Individual Marksheet</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No finished results found matching current query criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredResults.map((r, index) => {
                const s = r.studentId;
                if (!s) return null;
                return (
                  <TableRow key={r._id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>#{index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {s.fullName}
                        {s.feedback && (
                          <Tooltip title={`Feedback: ${s.feedback}`} arrow>
                            <Chip
                              label="Feedback"
                              color="info"
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 'bold', fontSize: '0.75rem', height: 18, cursor: 'help' }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{r.mcqScore}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{r.codingScore}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1rem' }}>
                      {r.finalScore}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.markedByAdmin ? 'MANUAL OVERRIDE' : 'AI EVALUATED'}
                        color={r.markedByAdmin ? 'secondary' : 'primary'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<Print />}
                        onClick={() => handlePrintMarksheet(s._id, s.fullName)}
                        variant="outlined"
                      >
                        Print Marksheet
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
 
      {/* Student Feedbacks Archive Card */}
      <Card sx={{ mt: 4, mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5 }}>
            Student Experience Feedback Summary
          </Typography>
          
          <Divider sx={{ mb: 2.5 }} />
 
          {results.filter(r => r.studentId && r.studentId.feedback).length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
              No student feedback has been submitted yet.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {results.filter(r => r.studentId && r.studentId.feedback).map(r => (
                <Grid item xs={12} key={r._id}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', borderLeft: '4px solid #6366F1' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {r.studentId.fullName} ({r.studentId.email})
                      </Typography>
                      <Chip 
                        label={`Score: ${r.finalScore}/100`} 
                        size="small" 
                        color={r.finalScore >= 50 ? "success" : "warning"}
                        variant="outlined" 
                        sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary', whiteSpace: 'pre-wrap' }}>
                      "{r.studentId.feedback}"
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminResults;
