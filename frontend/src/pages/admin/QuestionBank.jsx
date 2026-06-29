import React, { useState, useEffect } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Alert, CircularProgress, Chip, Card } from '@mui/material';
import { Add, Edit, Delete, FileUpload, Refresh, Search, Warning } from '@mui/icons-material';
import api from '../../services/api';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Search
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  // Forms
  const [topic, setTopic] = useState('PYTHON');
  const [questionText, setQuestionText] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [correctAns, setCorrectAns] = useState('');
  
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);
  
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [importLogs, setImportLogs] = useState('');

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/questions');
      setQuestions(response.data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Filter list locally for fast interactivity
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.questionText.toLowerCase().includes(search.toLowerCase()) || 
                          q.topic.toLowerCase().includes(search.toLowerCase());
    const matchesTopic = topicFilter === 'all' || q.topic === topicFilter;
    return matchesSearch && matchesTopic;
  });

  // Extract unique topics for dropdown
  const uniqueTopics = ['PYTHON', 'NUMPY', 'PANDAS', 'MATPLOTLIB', 'EDA', 'AI/ML BASICS', 'LINEAR REGRESSION', 'LOGISTIC REGRESSION', 'DECISION TREE', 'DEEP LEARNING', 'CNN'];

  // Add Question Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    const options = [opt1.trim(), opt2.trim(), opt3.trim(), opt4.trim()];
    if (!options.includes(correctAns)) {
      setFormError('Correct Answer must match one of the 4 options exactly.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/questions', {
        topic,
        questionText,
        options,
        correctAnswer: correctAns,
      });
      setAddOpen(false);
      resetForm();
      fetchQuestions();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create question.');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Question Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const options = [opt1.trim(), opt2.trim(), opt3.trim(), opt4.trim()];
    if (!options.includes(correctAns)) {
      setFormError('Correct Answer must match one of the 4 options exactly.');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/questions/${selectedQuestion._id}`, {
        topic,
        questionText,
        options,
        correctAnswer: correctAns,
      });
      setEditOpen(false);
      resetForm();
      fetchQuestions();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update question.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Question Submit
  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/questions/${selectedQuestion._id}`);
      setDeleteOpen(false);
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk CSV Question Import
  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkFile) return;

    setSubmitting(true);
    setImportLogs('');
    setFormError('');

    const formData = new FormData();
    formData.append('file', bulkFile);

    try {
      const response = await api.post('/questions/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const logs = response.data.errors && response.data.errors.length > 0 
        ? `Errors:\n${response.data.errors.join('\n')}` 
        : '';
        
      setImportLogs(`${response.data.message}\n${logs}`);
      setBulkFile(null);
      fetchQuestions();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Bulk upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (q) => {
    setSelectedQuestion(q);
    setTopic(q.topic);
    setQuestionText(q.questionText);
    setOpt1(q.options[0]);
    setOpt2(q.options[1]);
    setOpt3(q.options[2]);
    setOpt4(q.options[3]);
    setCorrectAns(q.correctAnswer);
    setFormError('');
    setEditOpen(true);
  };

  const openDeleteDialog = (q) => {
    setSelectedQuestion(q);
    setDeleteOpen(true);
  };

  const resetForm = () => {
    setTopic('PYTHON');
    setQuestionText('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setOpt4('');
    setCorrectAns('');
    setFormError('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          MCQ Question Bank Management
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<FileUpload />} onClick={() => { setBulkOpen(true); setImportLogs(''); setFormError(''); }}>
            Bulk Upload (CSV)
          </Button>
          <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => { resetForm(); setAddOpen(true); }}>
            Add Question
          </Button>
        </Stack>
      </Box>

      {/* Local Search and Filter cards */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              label="Search Questions"
              variant="outlined"
              size="small"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic or text..."
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Topic</InputLabel>
              <Select
                value={topicFilter}
                label="Filter by Topic"
                onChange={(e) => setTopicFilter(e.target.value)}
              >
                <MenuItem value="all">All Topics</MenuItem>
                {uniqueTopics.map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2} md={3}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={fetchQuestions} sx={{ height: 40 }} fullWidth>
              Refresh Bank
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Questions list Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ width: '130px', fontWeight: 'bold' }}>Topic</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Question Description</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Correct Answer</TableCell>
              <TableCell sx={{ width: '110px', fontWeight: 'bold', align: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : filteredQuestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No questions found. Try adding questions or updating filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredQuestions.map((q) => (
                <TableRow key={q._id} hover>
                  <TableCell>
                    <Chip label={q.topic} size="small" color="primary" variant="outlined" sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{q.questionText}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {q.options.map((opt, i) => (
                        <Typography key={i} variant="caption" sx={{
                          px: 1, py: 0.2, bgcolor: opt === q.correctAnswer ? 'success.light' : 'action.hover',
                          color: opt === q.correctAnswer ? 'success.contrastText' : 'text.secondary',
                          borderRadius: '4px', border: '1px solid', borderColor: opt === q.correctAnswer ? 'success.main' : 'divider'
                        }}>
                          {i + 1}. {opt}
                        </Typography>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>{q.correctAnswer}</TableCell>
                  <TableCell>
                    <IconButton size="small" color="secondary" onClick={() => openEditModal(q)} sx={{ mr: 0.5 }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => openDeleteDialog(q)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ADD DIALOG */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleAddSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Add MCQ Question</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            
            <FormControl fullWidth size="small" sx={{ my: 1.5 }}>
              <InputLabel>Question Topic</InputLabel>
              <Select value={topic} label="Question Topic" onChange={(e) => setTopic(e.target.value)}>
                {uniqueTopics.map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Question Description"
              fullWidth
              multiline
              rows={2}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              sx={{ mb: 2 }}
              required
            />

            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Options</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField label="Option 1" fullWidth size="small" value={opt1} onChange={(e) => setOpt1(e.target.value)} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Option 2" fullWidth size="small" value={opt2} onChange={(e) => setOpt2(e.target.value)} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Option 3" fullWidth size="small" value={opt3} onChange={(e) => setOpt3(e.target.value)} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Option 4" fullWidth size="small" value={opt4} onChange={(e) => setOpt4(e.target.value)} required />
              </Grid>
            </Grid>

            <FormControl fullWidth size="small" required>
              <InputLabel>Correct Answer Choice</InputLabel>
              <Select value={correctAns} label="Correct Answer Choice" onChange={(e) => setCorrectAns(e.target.value)}>
                {opt1 && <MenuItem value={opt1}>Option 1: {opt1}</MenuItem>}
                {opt2 && <MenuItem value={opt2}>Option 2: {opt2}</MenuItem>}
                {opt3 && <MenuItem value={opt3}>Option 3: {opt3}</MenuItem>}
                {opt4 && <MenuItem value={opt4}>Option 4: {opt4}</MenuItem>}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAddOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              Add Question
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleEditSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Edit MCQ Question</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            
            <FormControl fullWidth size="small" sx={{ my: 1.5 }}>
              <InputLabel>Question Topic</InputLabel>
              <Select value={topic} label="Question Topic" onChange={(e) => setTopic(e.target.value)}>
                {uniqueTopics.map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Question Description"
              fullWidth
              multiline
              rows={2}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              sx={{ mb: 2 }}
              required
            />

            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Options</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField label="Option 1" fullWidth size="small" value={opt1} onChange={(e) => setOpt1(e.target.value)} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Option 2" fullWidth size="small" value={opt2} onChange={(e) => setOpt2(e.target.value)} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Option 3" fullWidth size="small" value={opt3} onChange={(e) => setOpt3(e.target.value)} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Option 4" fullWidth size="small" value={opt4} onChange={(e) => setOpt4(e.target.value)} required />
              </Grid>
            </Grid>

            <FormControl fullWidth size="small" required>
              <InputLabel>Correct Answer Choice</InputLabel>
              <Select value={correctAns} label="Correct Answer Choice" onChange={(e) => setCorrectAns(e.target.value)}>
                <MenuItem value={opt1}>Option 1: {opt1}</MenuItem>
                <MenuItem value={opt2}>Option 2: {opt2}</MenuItem>
                <MenuItem value={opt3}>Option 3: {opt3}</MenuItem>
                <MenuItem value={opt4}>Option 4: {opt4}</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" /> Delete MCQ Question
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete this question? This will remove it from the question pool database.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete Question
          </Button>
        </DialogActions>
      </Dialog>

      {/* BULK UPLOAD DIALOG */}
      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleBulkImport}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Bulk Upload Questions (CSV)</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Typography variant="body2" sx={{ mb: 2 }}>
              Upload a CSV file containing the headers: <strong>topic</strong>, <strong>questionText</strong>, <strong>option1</strong>, <strong>option2</strong>, <strong>option3</strong>, <strong>option4</strong>, and <strong>correctAnswer</strong>.
            </Typography>

            <Box sx={{ border: '2px dashed', borderColor: 'divider', p: 3, textAlign: 'center', borderRadius: '8px', bgcolor: 'action.hover', mb: 2 }}>
              <FileUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" sx={{ display: 'block', mb: 1.5 }}>
                {bulkFile ? bulkFile.name : 'Select or drop your CSV file'}
              </Typography>
              <Button component="label" variant="outlined" size="small">
                Browse Files
                <input type="file" hidden accept=".csv" onChange={(e) => setBulkFile(e.target.files[0])} />
              </Button>
            </Box>

            {importLogs && (
              <TextField
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                value={importLogs}
                disabled
                label="Import Logs"
                InputProps={{ style: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setBulkOpen(false)} variant="outlined">Close</Button>
            <Button type="submit" variant="contained" color="primary" disabled={!bulkFile || submitting}>
              {submitting ? 'Uploading...' : 'Import'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
export default QuestionBank;
