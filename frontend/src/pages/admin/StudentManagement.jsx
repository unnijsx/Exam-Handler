import React, { useState, useEffect } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Select, MenuItem, InputLabel, FormControl, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Alert, CircularProgress, Stack, Card, Grid, Tooltip } from '@mui/material';
import { Add, Edit, Delete, FileUpload, FileDownload, Visibility, Search, Refresh, Warning, PlayArrow, Pause, AutoAwesome } from '@mui/icons-material';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const StudentManagement = () => {
  const navigate = useNavigate();
  
  // Lists and states
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [evaluatingStudentId, setEvaluatingStudentId] = useState(null);
  const [bulkEvaluating, setBulkEvaluating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [endAllOpen, setEndAllOpen] = useState(false);
  const [resetAllOpen, setResetAllOpen] = useState(false);

  const searchRef = React.useRef(search);
  React.useEffect(() => {
    searchRef.current = search;
  }, [search]);

  // Forms
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [importLogs, setImportLogs] = useState('');

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
 
  const handleIndividualEvaluate = async (studentId) => {
    setEvaluatingStudentId(studentId);
    try {
      await api.post(`/evaluations/${studentId}/evaluate`);
      fetchStudents();
    } catch (err) {
      console.error('AI Evaluation failed:', err);
      alert(err.response?.data?.message || 'Gemini evaluation failed.');
    } finally {
      setEvaluatingStudentId(null);
    }
  };
 
  const handleEvaluateAll = async () => {
    const completedStudents = students.filter(s => s.examStatus === 'completed');
    if (completedStudents.length === 0) {
      alert('No completed student exams found to evaluate.');
      return;
    }
 
    setBulkEvaluating(true);
    setFormError('');
 
    try {
      for (let i = 0; i < completedStudents.length; i++) {
        const student = completedStudents[i];
        setBulkProgress(`${i + 1}/${completedStudents.length}`);
        await api.post(`/evaluations/${student._id}/evaluate`);
        const refreshResponse = await api.get(`/students?search=${searchRef.current}&status=${statusFilter}`);
        setStudents(refreshResponse.data);
      }
      alert('AI Evaluation completed for all finished students.');
    } catch (err) {
      console.error('AI Bulk Evaluation Error:', err);
      setFormError(err.response?.data?.message || 'Error occurred during sequential AI evaluation.');
    } finally {
      setBulkEvaluating(false);
      setBulkProgress('');
      fetchStudents();
    }
  };
 
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/students?search=${search}&status=${statusFilter}`);
      setStudents(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();

    const interval = setInterval(() => {
      api.get(`/students?search=${searchRef.current}&status=${statusFilter}`)
        .then(response => setStudents(response.data))
        .catch(err => console.error('Polling failed:', err));
    }, 10000);

    return () => clearInterval(interval);
  }, [statusFilter]); // Reload on filter click

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchStudents();
    }
  };

  // Add Student Submission
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/students', { fullName: name, email });
      setName('');
      setEmail('');
      setAddOpen(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add student.');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Student Submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.put(`/students/${selectedStudent._id}`, {
        fullName: name,
        email,
        examStatus: editStatus
      });
      setEditOpen(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update student.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Student Submission
  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/students/${selectedStudent._id}`);
      setDeleteDialogOpen(false);
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  // CSV Import Submission
  const handleCsvImport = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    setSubmitting(true);
    setImportLogs('');
    setFormError('');

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const response = await api.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const logs = response.data.errors && response.data.errors.length > 0 
        ? `Errors:\n${response.data.errors.join('\n')}` 
        : '';
      
      setImportLogs(`${response.data.message}\n${logs}`);
      setCsvFile(null);
      fetchStudents();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Import failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Export Results Excel (Downloads via direct iframe/window link)
  const handleExportExcel = () => {
    const token = localStorage.getItem('token');
    window.open(`${import.meta.env.VITE_API_BASE_URL || '/api'}/reports/excel?token=${token}`, '_blank');
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setName(student.fullName);
    setEmail(student.email);
    setEditStatus(student.examStatus);
    setFormError('');
    setEditOpen(true);
  };

  const openDeleteDialog = (student) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  };

  const handleTogglePause = async (student) => {
    try {
      await api.post(`/students/${student._id}/pause-toggle`);
      fetchStudents();
    } catch (err) {
      console.error('Failed to toggle student exam pause status:', err);
    }
  };

  const handlePauseAll = async () => {
    try {
      await api.post('/students/global/pause-all');
      fetchStudents();
    } catch (err) {
      console.error('Failed to pause all timers:', err);
    }
  };

  const handleResumeAll = async () => {
    try {
      await api.post('/students/global/resume-all');
      fetchStudents();
    } catch (err) {
      console.error('Failed to resume all timers:', err);
    }
  };

  const handleEndAllConfirm = async () => {
    try {
      await api.post('/students/global/end-all');
      setEndAllOpen(false);
      fetchStudents();
    } catch (err) {
      console.error('Failed to end all exams:', err);
    }
  };

  const handleResetAllConfirm = async () => {
    try {
      await api.post('/students/global/reset-all');
      setResetAllOpen(false);
      fetchStudents();
    } catch (err) {
      console.error('Failed to reset all exams:', err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Student Registration Management
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<FileUpload />} onClick={() => { setImportOpen(true); setImportLogs(''); setFormError(''); }}>
            Import CSV
          </Button>
          <Button variant="outlined" color="secondary" startIcon={<FileDownload />} onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => { setAddOpen(true); setName(''); setEmail(''); setFormError(''); }}>
            Add Student
          </Button>
        </Stack>
      </Box>

      {/* Global Session Controls */}
      <Card sx={{ p: 2, mb: 3, borderLeft: '6px solid #EF4444', bgcolor: 'background.paper' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
          Global Exam Session Controls
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
          <Button
            variant="contained"
            color="warning"
            size="small"
            onClick={handlePauseAll}
            sx={{ fontWeight: 'bold' }}
          >
            Pause All Exams
          </Button>
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={handleResumeAll}
            sx={{ fontWeight: 'bold' }}
          >
            Resume All Exams
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleEvaluateAll}
            disabled={bulkEvaluating}
            sx={{ fontWeight: 'bold' }}
          >
            {bulkEvaluating ? `Evaluating... (${bulkProgress})` : 'AI Evaluate All Completed'}
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => setEndAllOpen(true)}
            sx={{ fontWeight: 'bold' }}
          >
            Force End All Exams
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => setResetAllOpen(true)}
            sx={{ fontWeight: 'bold' }}
          >
            Reset All Sessions
          </Button>
        </Stack>
      </Card>

      {/* Filter and Search Bar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              label="Search Students"
              variant="outlined"
              size="small"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="Search by Name or Email... (Press Enter)"
              InputProps={{
                endAdornment: (
                  <IconButton onClick={fetchStudents} size="small">
                    <Search />
                  </IconButton>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="not_started">Not Started</MenuItem>
                <MenuItem value="mcq_in_progress">MCQ In Progress</MenuItem>
                <MenuItem value="coding_in_progress">Coding In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2} md={3}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={fetchStudents} sx={{ height: 40 }}>
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Student List Grid Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Assigned Animals</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>MCQ</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Coding</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
              <TableCell sx={{ fontWeight: 'bold', align: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No students found matching current query criteria.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => {
                let chipColor = 'default';
                if (student.examStatus === 'completed') chipColor = 'success';
                else if (student.examStatus === 'not_started') chipColor = 'default';
                else chipColor = 'warning';

                return (
                  <TableRow key={student._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {student.fullName}
                        {student.pauseRequested && (
                          <Chip
                            label="Pause Requested"
                            color="error"
                            size="small"
                            sx={{
                              fontWeight: 'bold',
                              fontSize: '0.65rem',
                              height: 18,
                              animation: 'blink 1.2s infinite ease-in-out',
                              '@keyframes blink': {
                                '0%': { opacity: 0.4 },
                                '50%': { opacity: 1 },
                                '100%': { opacity: 0.4 }
                              }
                            }}
                          />
                        )}
                        {student.isPaused && (
                          <Chip
                            label="PAUSED"
                            color="warning"
                            size="small"
                            sx={{ fontWeight: 'bold', fontSize: '0.65rem', height: 18 }}
                          />
                        )}
                        {student.feedback && (
                          <Tooltip title={`Feedback: ${student.feedback}`} arrow>
                            <Chip
                              label="Feedback"
                              color="info"
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 'bold', fontSize: '0.65rem', height: 18, cursor: 'help' }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={student.examStatus.replace(/_/g, ' ').toUpperCase()}
                        color={chipColor}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      {student.assignedClasses && student.assignedClasses.length > 0 ? (
                        student.assignedClasses.map((cls) => (
                          <Chip key={cls} label={cls} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary">Not Assigned</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{student.mcqScore !== null ? student.mcqScore : '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{student.codingScore !== null ? student.codingScore : '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {student.finalScore !== null ? student.finalScore : '-'}
                    </TableCell>
                    <TableCell>
                      {(student.examStatus === 'mcq_in_progress' || student.examStatus === 'coding_in_progress') && (
                        <IconButton
                          size="small"
                          color={student.isPaused ? 'success' : 'warning'}
                          onClick={() => handleTogglePause(student)}
                          sx={{ mr: 0.5 }}
                          title={student.isPaused ? 'Resume Exam' : 'Pause Exam'}
                        >
                          {student.isPaused ? <PlayArrow fontSize="small" /> : <Pause fontSize="small" />}
                        </IconButton>
                      )}
                      {student.examStatus === 'completed' && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleIndividualEvaluate(student._id)}
                          disabled={evaluatingStudentId === student._id}
                          title="Trigger AI Evaluation"
                          sx={{ mr: 0.5 }}
                        >
                          {evaluatingStudentId === student._id ? (
                            <CircularProgress size={18} />
                          ) : (
                            <AutoAwesome fontSize="small" />
                          )}
                        </IconButton>
                      )}
                      <IconButton size="small" color="primary" onClick={() => navigate(`/admin/review/${student._id}`)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="secondary" onClick={() => openEditModal(student)} sx={{ mx: 0.5 }}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => openDeleteDialog(student)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ADD DIALOG */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleAddSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Register New Student</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <TextField
              label="Full Name"
              fullWidth
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ my: 1.5 }}
              required
            />
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAddOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleEditSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Update Student Profiles</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <TextField
              label="Full Name"
              fullWidth
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ my: 1.5 }}
              required
            />
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            <FormControl fullWidth size="small">
              <InputLabel>Exam Status</InputLabel>
              <Select
                value={editStatus}
                label="Exam Status"
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <MenuItem value="not_started">Not Started</MenuItem>
                <MenuItem value="mcq_in_progress">MCQ In Progress</MenuItem>
                <MenuItem value="coding_in_progress">Coding In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              Update
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" /> Delete Student Record
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete <strong>{selectedStudent?.fullName}</strong>? 
            This action will erase their exam session answers, code submissions, uploaded screenshots, and final results. 
            This action is permanent and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete Records
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV IMPORT DIALOG */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCsvImport}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Import Students via CSV</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Typography variant="body2" sx={{ mb: 2 }}>
              Select a CSV file containing columns named <strong>fullName</strong> (or Full Name) and <strong>email</strong>. 
              Duplicate emails will be skipped automatically.
            </Typography>

            <Box sx={{ border: '2px dashed', borderColor: 'divider', p: 3, textAlign: 'center', borderRadius: '8px', bgcolor: 'action.hover', mb: 2 }}>
              <FileUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" sx={{ display: 'block', mb: 1.5 }}>
                {csvFile ? csvFile.name : 'Select or drop your CSV file'}
              </Typography>
              <Button component="label" variant="outlined" size="small">
                Browse Files
                <input type="file" hidden accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
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
            <Button onClick={() => setImportOpen(false)} variant="outlined">Close</Button>
            <Button type="submit" variant="contained" color="primary" disabled={!csvFile || submitting}>
              {submitting ? 'Uploading...' : 'Import'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* GLOBAL END ALL EXAMS CONFIRM DIALOG */}
      <Dialog open={endAllOpen} onClose={() => setEndAllOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" /> Force End All Active Exams
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to force complete and lock all in-progress student exams? 
            This will calculate their scores based on current progress and move them to completed. 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEndAllOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleEndAllConfirm} variant="contained" color="error">
            End All Exams
          </Button>
        </DialogActions>
      </Dialog>

      {/* GLOBAL RESET ALL EXAMS CONFIRM DIALOG */}
      <Dialog open={resetAllOpen} onClose={() => setResetAllOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" /> RESET ALL STUDENT EXAMS
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>WARNING: DESTRUCTIVE ACTION!</strong>
          </Typography>
          <Typography variant="body2">
            Are you sure you want to completely reset all student exam records? 
            This will delete all answers, code submissions, uploaded weights, screenshot files, and final scores. 
            All student registration statuses will revert back to 'Not Started'. 
            This action is permanent and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResetAllOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleResetAllConfirm} variant="contained" color="error">
            Reset All Records
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentManagement;
