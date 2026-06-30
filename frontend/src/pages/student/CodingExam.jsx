import React, { useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, TextField, Divider, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, LinearProgress, Stack, useTheme, IconButton, Container, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { CloudUpload, CheckCircle, Delete, Code, Help, Warning, ExpandMore, Image } from '@mui/icons-material';
import { useExam } from '../../context/ExamContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1920;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'));
            return;
          }
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        0.7
      );
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
};

const CodingExam = () => {
  const { user } = useAuth();
  const { session, loading, startCodingExam, requestPause } = useExam();
  const navigate = useNavigate();
  const theme = useTheme();

  // Rules screen states
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const handleRequestPause = async () => {
    try {
      await requestPause();
    } catch (err) {
      console.error(err);
    }
  };

  // Submission state
  const [codeContent, setCodeContent] = useState('');
  const [codeFile, setCodeFile] = useState(null);
  const [ptFile, setPtFile] = useState(null);
  
  // Screenshot states (holding File objects)
  const [screenshotTraining, setScreenshotTraining] = useState(null);
  const [screenshotAccuracy, setScreenshotAccuracy] = useState(null);
  const [screenshotPrediction, setScreenshotPrediction] = useState(null);

  // Previews (holding URL strings)
  const [previewTraining, setPreviewTraining] = useState('');
  const [previewAccuracy, setPreviewAccuracy] = useState('');
  const [previewPrediction, setPreviewPrediction] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (loading || !session) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
        <LinearProgress sx={{ width: '200px' }} />
        <Typography variant="body2" color="text.secondary">Loading coding environment...</Typography>
      </Box>
    );
  }

  // If coding has not started yet, show Rules Screen
  if (!session.codingStarted) {
    const handleStartCodingConfirm = async () => {
      setStartConfirmOpen(false);
      setStarting(true);
      setErrorMsg('');
      try {
        await startCodingExam();
      } catch (err) {
        setErrorMsg(err.message || 'Failed to start coding phase.');
        setStarting(false);
      }
    };

    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}
        <Card sx={{ p: 2, borderLeft: '6px solid #2563EB' }}>
          <CardContent>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 800, mb: 1.5 }}>
              EvalAI Campus: Phase 2 - Coding Assessment Rules
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3, color: 'text.secondary' }}>
              Please read the following instructions carefully before starting the coding phase.
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2.5} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircle color="primary" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Assigned Task & Classes</Typography>
                  <Typography variant="body2" color="text.secondary">
                    You have been assigned 3 specific animal classes. You must train a Convolutional Neural Network (CNN) model using ONLY the data belonging to these categories.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircle color="primary" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Phase Duration</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration: <strong>3 Hours</strong>. The countdown begins the moment you click 'Start Coding Exam'. Ensure you submit before the timer expires.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <CheckCircle color="primary" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Submission Requirements</Typography>
                  <Typography variant="body2" color="text.secondary">
                    You must paste or upload your source code, and upload **three mandatory screenshots**:
                    1. Training Logs/Epochs showing training progression.
                    2. Accuracy/Loss curves showing validation performance.
                    3. Prediction Outputs showing output prediction labels.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Warning color="error" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'error.main' }}>Action Required</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Once you start, the clock ticks continuously. Please ensure you have stable power and internet.
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
                {starting ? 'Initializing...' : 'Start Coding Exam'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Start Coding Exam Confirm Dialog */}
        <Dialog open={startConfirmOpen} onClose={() => setStartConfirmOpen(false)}>
          <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" /> Confirm Coding Phase Start
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you ready to begin the coding practical phase? Your 3-hour coding timer will start ticking immediately, and you will be shown your assigned classes and workspace instructions.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setStartConfirmOpen(false)} variant="outlined">Cancel</Button>
            <Button onClick={handleStartCodingConfirm} variant="contained" color="primary" autoFocus>
              Start Coding Phase
            </Button>
          </DialogActions>
        </Dialog>

        {/* Pause Overlay inside Rules screen too */}
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
      </Container>
    );
  }

  // Handle screenshots selection
  const handleScreenshotChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size and extensions
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['png', 'jpg', 'jpeg'].includes(ext)) {
      setErrorMsg('Screenshots must be PNG, JPG, or JPEG files.');
      return;
    }

    setErrorMsg('');
    let finalFile = file;
    try {
      finalFile = await compressImage(file);
    } catch (err) {
      console.warn('Image compression failed, using original file:', err);
      // Silently fall back to the original file
      finalFile = file;
    }

    const previewUrl = URL.createObjectURL(finalFile);

    if (field === 'training') {
      setScreenshotTraining(finalFile);
      setPreviewTraining(previewUrl);
    } else if (field === 'accuracy') {
      setScreenshotAccuracy(finalFile);
      setPreviewAccuracy(previewUrl);
    } else if (field === 'prediction') {
      setScreenshotPrediction(finalFile);
      setPreviewPrediction(previewUrl);
    }
  };

  const removeScreenshot = (field) => {
    if (field === 'training') {
      setScreenshotTraining(null);
      setPreviewTraining('');
    } else if (field === 'accuracy') {
      setScreenshotAccuracy(null);
      setPreviewAccuracy('');
    } else if (field === 'prediction') {
      setScreenshotPrediction(null);
      setPreviewPrediction('');
    }
  };

  // Check validity
  const isFormValid = screenshotTraining && screenshotAccuracy && screenshotPrediction;

  const handleSubmitClick = () => {
    if (!isFormValid) {
      setErrorMsg('Please upload all 3 mandatory screenshots before final submission.');
      return;
    }
    setErrorMsg('');
    setConfirmOpen(true);
  };

  const handleFinalSubmit = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('codeContent', codeContent);
    if (codeFile) formData.append('codeFile', codeFile);
    if (ptFile) formData.append('ptFile', ptFile);
    
    formData.append('screenshotTraining', screenshotTraining);
    formData.append('screenshotAccuracy', screenshotAccuracy);
    formData.append('screenshotPrediction', screenshotPrediction);

    try {
      await api.post('/submissions', formData);

      // Update local storage status
      if (user) {
        const stored = localStorage.getItem('user');
        if (stored) {
          const userObj = JSON.parse(stored);
          userObj.examStatus = 'completed';
          localStorage.setItem('user', JSON.stringify(userObj));
        }
      }
      
      navigate('/exam/completed');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Submission failed. Please check file formats and sizes.');
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {errorMsg}
        </Alert>
      )}

      {submitting && (
        <Card sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>Uploading Submission Files...</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Please do not close this browser or reload the page.</Typography>
          <LinearProgress />
        </Card>
      )}

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Left Side: Instructions Panel */}
        <Grid item xs={12} md={5} lg={4.5}>
          <Card sx={{ borderLeft: `6px solid ${theme.palette.primary.main}`, mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
                  Coding Phase Instructions
                </Typography>
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  disabled={!!session.pauseRequested || !!session.isPaused}
                  onClick={handleRequestPause}
                  sx={{ fontWeight: 'bold', textTransform: 'none', borderRadius: '6px' }}
                >
                  {session.isPaused
                    ? 'Exam Paused'
                    : session.pauseRequested
                      ? 'Pause Requested...'
                      : 'Request Pause'}
                </Button>
              </Box>

              {/* Assigned Classes Widget */}
              <Box sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', p: 2, borderRadius: '8px', mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5, letterSpacing: 0.5 }}>
                  YOUR ASSIGNED CLASSES:
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>
                  {user?.assignedClasses?.join(', ') || 'Loading...'}
                </Typography>
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Workflow Tasks:
              </Typography>

              <Stack spacing={1.5}>
                {[
                  'Open your Downloads folder.',
                  'Open the Archive folder.',
                  'Open the animal_data folder.',
                  `Locate only your 3 assigned animal folders (${user?.assignedClasses?.join(', ')}).`,
                  'Copy ONLY your assigned animal folders.',
                  'Paste them into your local workspace / dataset folder.',
                  'Open Visual Studio Code (or Jupyter Notebook).',
                  'Train a CNN model of your choice using ONLY the assigned classes.',
                  'Plot accuracy/loss curves and generate test prediction labels.',
                  'Submit your Python/Notebook code and upload the 3 required screenshots below.'
                ].map((step, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main', bgcolor: 'action.selected', px: 1, borderRadius: '4px' }}>
                      {idx + 1}
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {step}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', color: 'text.secondary' }}>
                <Help fontSize="small" />
                <Typography variant="caption">
                  You may refer to previously completed practice datasets for implementation references.
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Screenshot Capture Guidelines */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="secondary" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Image color="secondary" fontSize="small" /> How to Take Screenshots
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Capture only the relevant active window or region to ensure files remain within size limits (max 5MB).
              </Typography>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Windows OS</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Press <code>Windows Key + Shift + S</code> to snip a region, or press <code>PrtScn</code>.
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>macOS</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Press <code>Command + Shift + 4</code>, drag to crop, and save. Placed on Desktop.
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Linux OS</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Press <code>Super + Shift + PrtScn</code> to snip, or press <code>PrtScn</code> for full screen.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Reference PyTorch Templates Collapsible Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 800, mb: 1, px: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Code fontSize="small" /> Reference PyTorch Code
              </Typography>
              
              <Accordion size="small" disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', overflow: 'hidden' }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>1. Custom Image Dataset Loader</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: 'action.hover', p: 1 }}>
                  <pre style={{ margin: 0, fontSize: '0.72rem', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre' }}>{`import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,))
])

train_dataset = datasets.ImageFolder(
    root='./dataset/train', 
    transform=transform
)
train_loader = DataLoader(
    train_dataset, 
    batch_size=32, 
    shuffle=True
)`}</pre>
                </AccordionDetails>
              </Accordion>

              <Accordion size="small" disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', overflow: 'hidden', mt: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>2. Basic CNN Architecture</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: 'action.hover', p: 1 }}>
                  <pre style={{ margin: 0, fontSize: '0.72rem', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre' }}>{`import torch.nn as nn

class SimpleCNN(nn.Module):
    def __init__(self, num_classes=3):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 16, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(16, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2)
        )
        self.classifier = nn.Sequential(
            nn.Linear(32 * 32 * 32, 128),
            nn.ReLU(),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        return self.classifier(x)`}</pre>
                </AccordionDetails>
              </Accordion>

              <Accordion size="small" disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', overflow: 'hidden', mt: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>3. Model Training Loop</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: 'action.hover', p: 1 }}>
                  <pre style={{ margin: 0, fontSize: '0.72rem', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre' }}>{`import torch.optim as optim

model = SimpleCNN(num_classes=3).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

for epoch in range(epochs):
    model.train()
    running_loss = 0.0
    for inputs, labels in train_loader:
        inputs, labels = inputs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item()`}</pre>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Code & Screenshot Uploaders */}
        <Grid item xs={12} md={7} lg={7.5}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Code color="primary" /> Submit Python Code
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Write/paste your full training script in the editor, or upload your python script file (.py, .ipynb, .txt).
              </Typography>

              <TextField
                multiline
                rows={12}
                fullWidth
                variant="outlined"
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="# Paste your CNN Python training and prediction code here..."
                inputProps={{ className: 'code-editor-textarea', style: { fontFamily: 'monospace' } }}
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    component="label"
                    variant="outlined"
                    fullWidth
                    startIcon={<CloudUpload />}
                    sx={{ py: 1.2 }}
                  >
                    {codeFile ? `Code: ${codeFile.name.substring(0, 15)}...` : 'Upload Code File'}
                    <input
                      type="file"
                      hidden
                      accept=".py,.ipynb,.txt"
                      onChange={(e) => setCodeFile(e.target.files[0])}
                    />
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    component="label"
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    startIcon={<CloudUpload />}
                    sx={{ py: 1.2 }}
                  >
                    {ptFile ? `Weights: ${ptFile.name.substring(0, 15)}...` : 'Upload Weights File (.pt)'}
                    <input
                      type="file"
                      hidden
                      accept=".pt"
                      onChange={(e) => setPtFile(e.target.files[0])}
                    />
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Screenshot Upload Blocks */}
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Mandatory Image Screenshots
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                You must upload exactly 3 screenshots to validate your model training and correctness.
              </Typography>

              <Grid container spacing={2.5}>
                {/* 1. Training Screenshot */}
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                    1. Training Logs/Epochs
                  </Typography>
                  {previewTraining ? (
                    <Box sx={{ position: 'relative', border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={previewTraining} alt="Training Logs" style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                      <IconButton
                        onClick={() => removeScreenshot('training')}
                        sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(255, 255, 255, 0.8)', '&:hover': { bgcolor: 'error.main', color: 'white' } }}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: '8px',
                      height: '140px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      bgcolor: 'action.hover',
                      position: 'relative'
                    }}>
                      <CloudUpload color="disabled" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="caption" color="text.secondary">Click to upload</Typography>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        onChange={(e) => handleScreenshotChange(e, 'training')}
                      />
                    </Box>
                  )}
                </Grid>

                {/* 2. Accuracy Graph Screenshot */}
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                    2. Accuracy Curves
                  </Typography>
                  {previewAccuracy ? (
                    <Box sx={{ position: 'relative', border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={previewAccuracy} alt="Accuracy Graph" style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                      <IconButton
                        onClick={() => removeScreenshot('accuracy')}
                        sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(255, 255, 255, 0.8)', '&:hover': { bgcolor: 'error.main', color: 'white' } }}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: '8px',
                      height: '140px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      bgcolor: 'action.hover',
                      position: 'relative'
                    }}>
                      <CloudUpload color="disabled" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="caption" color="text.secondary">Click to upload</Typography>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        onChange={(e) => handleScreenshotChange(e, 'accuracy')}
                      />
                    </Box>
                  )}
                </Grid>

                {/* 3. Prediction Output Screenshot */}
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                    3. Prediction Labels
                  </Typography>
                  {previewPrediction ? (
                    <Box sx={{ position: 'relative', border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={previewPrediction} alt="Prediction Labels" style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                      <IconButton
                        onClick={() => removeScreenshot('prediction')}
                        sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(255, 255, 255, 0.8)', '&:hover': { bgcolor: 'error.main', color: 'white' } }}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: '8px',
                      height: '140px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      bgcolor: 'action.hover',
                      position: 'relative'
                    }}>
                      <CloudUpload color="disabled" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="caption" color="text.secondary">Click to upload</Typography>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        onChange={(e) => handleScreenshotChange(e, 'prediction')}
                      />
                    </Box>
                  )}
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={submitting}
                onClick={handleSubmitClick}
                startIcon={<CheckCircle />}
                sx={{ py: 1.5 }}
              >
                Submit Coding Assessment
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Submission Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" /> Confirm Final Submission
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit your coding exam now? 
            Once submitted, your assessment console will be completely locked, and you will not be able to modify your code, weights, or screenshots.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleFinalSubmit} variant="contained" color="success" autoFocus>
            Confirm Submit
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
  );
};

export default CodingExam;
