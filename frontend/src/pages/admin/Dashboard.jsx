import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, useTheme } from '@mui/material';
import { People, PlayArrow, QueryBuilder, CheckCircle, Speed, Star, TrendingDown } from '@mui/icons-material';
import api from '../../services/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/results/dashboard');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          Loading admin metrics...
        </Typography>
      </Box>
    );
  }

  const { cards, charts, recentActivity } = stats;

  const cardData = [
    { title: 'Total Students', value: cards.totalStudents, icon: <People />, color: 'primary.main', bg: 'primary.light' },
    { title: 'Not Started', value: cards.notStarted, icon: <PlayArrow />, color: 'text.secondary', bg: 'action.hover' },
    { title: 'In Progress', value: cards.inProgress, icon: <QueryBuilder />, color: 'warning.main', bg: 'warning.light' },
    { title: 'Completed', value: cards.completed, icon: <CheckCircle />, color: 'success.main', bg: 'success.light' },
    { title: 'Average Score', value: `${cards.avgScore} / 100`, icon: <Speed />, color: 'primary.main', bg: 'primary.light' },
    { title: 'Highest Score', value: `${cards.highestScore} / 100`, icon: <Star />, color: 'warning.main', bg: 'warning.light' },
    { title: 'Lowest Score', value: `${cards.lowestScore} / 100`, icon: <TrendingDown />, color: 'error.main', bg: 'error.light' },
  ];

  // MCQ Distribution Chart Data
  const mcqData = {
    labels: Object.keys(charts.mcqDistribution),
    datasets: [
      {
        label: 'Number of Students',
        data: Object.values(charts.mcqDistribution),
        backgroundColor: '#2563EB',
        borderRadius: 6,
      },
    ],
  };

  // Coding Distribution Chart Data
  const codingData = {
    labels: Object.keys(charts.codingDistribution),
    datasets: [
      {
        label: 'Number of Students',
        data: Object.values(charts.codingDistribution),
        backgroundColor: '#10B981',
        borderRadius: 6,
      },
    ],
  };

  // Overall Performance Doughnut Data
  const overallData = {
    labels: Object.keys(charts.overallDistribution),
    datasets: [
      {
        data: Object.values(charts.overallDistribution),
        backgroundColor: [
          '#EF4444', // 0-20
          '#F59E0B', // 21-40
          '#6366F1', // 41-60
          '#3B82F6', // 61-80
          '#10B981', // 81-100
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
        Exam Analytics Dashboard
      </Typography>

      {/* Analytics Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
        {cardData.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} lg={idx < 4 ? 3 : 4} key={card.title}>
            <Card sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
              <Box sx={{
                p: 1.5,
                borderRadius: '12px',
                bgcolor: card.bg,
                color: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}>
                {card.icon}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                  {card.title}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {card.value}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts section */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
        {/* MCQ Performance Bar */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent sx={{ height: '340px' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                MCQ Scores Distribution (Max 50)
              </Typography>
              <Box sx={{ height: '240px' }}>
                <Bar data={mcqData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Coding Performance Bar */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent sx={{ height: '340px' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Coding Scores Distribution (Max 50)
              </Typography>
              <Box sx={{ height: '240px' }}>
                <Bar data={codingData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Overall Doughnut */}
        <Grid item xs={12} md={12} lg={4}>
          <Card>
            <CardContent sx={{ height: '340px' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Overall Scores Distribution (Max 100)
              </Typography>
              <Box sx={{ height: '230px', display: 'flex', justifyContent: 'center' }}>
                <Doughnut
                  data={overallData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } } }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent activity & Student overview */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Recent Student Activity Log
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ border: 'none' }}>
                <Table sx={{ minWidth: 600 }}>
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Last Updated Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivity.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                          No student activity records found. Add students to begin.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentActivity.map((student) => {
                        let chipColor = 'default';
                        if (student.examStatus === 'completed') chipColor = 'success';
                        else if (student.examStatus === 'not_started') chipColor = 'default';
                        else chipColor = 'warning';

                        return (
                          <TableRow key={student._id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{student.fullName}</TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell>
                              <Chip
                                label={student.examStatus.replace(/_/g, ' ').toUpperCase()}
                                color={chipColor}
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            </TableCell>
                            <TableCell>{new Date(student.updatedAt).toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
