"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Container,
  Paper,
  Stack,
  Avatar,
  Tooltip,
  Divider,
  Alert,
  AlertTitle,
} from "@mui/material";
import {
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  MenuBook as MenuBookIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { green, orange, blue, purple, grey } from "@mui/material/colors";

interface ExamSubject {
  id: number;
  marksEntered: boolean;
  marksEnteredAt?: string;
  exam: {
    id: number;
    title: string;
    year: number;
    term: number;
    status: string;
    grade: {
      level: number;
    };
  };
  subject: {
    id: number;
    name: string;
  };
}

const TeacherMarksEntryDashboard = () => {
  const router = useRouter();
  const [assignedExams, setAssignedExams] = useState<ExamSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    completedSubjects: 0,
    pendingSubjects: 0,
    activeExams: 0,
  });

  useEffect(() => {
    fetchAssignedExams();
  }, []);

  const fetchAssignedExams = async () => {
    try {
      const response = await fetch("/api/teacher/assigned-exams");
      if (response.ok) {
        const data = await response.json();
        setAssignedExams(data.examSubjects || []);
        
        // Calculate stats
        const totalSubjects = data.examSubjects?.length || 0;
        const completedSubjects = data.examSubjects?.filter((es: ExamSubject) => es.marksEntered).length || 0;
        const pendingSubjects = totalSubjects - completedSubjects;
        const activeExams = new Set(data.examSubjects?.map((es: ExamSubject) => es.exam.id)).size;
        
        setStats({
          totalSubjects,
          completedSubjects,
          pendingSubjects,
          activeExams,
        });
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch assigned exams");
      }
    } catch (error) {
      console.error("Error fetching assigned exams:", error);
      toast.error("Failed to fetch assigned exams");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "success";
      case "MARKS_ENTRY":
        return "info";
      case "CLASS_REVIEW":
        return "warning";
      case "DRAFT":
        return "default";
      default:
        return "default";
    }
  };

  const progressPercentage = stats.totalSubjects > 0 
    ? Math.round((stats.completedSubjects / stats.totalSubjects) * 100) 
    : 0;

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={0} sx={{ p: 4, textAlign: "center" }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <LinearProgress sx={{ width: "100%", maxWidth: 400 }} />
            <Typography variant="body1" color="text.secondary">
              Loading your assigned exams...
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              📝 Marks Entry Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage marks for your assigned subjects
            </Typography>
          </Box>
          <Link href="/list/exams" style={{ textDecoration: "none" }}>
            <Button
              variant="contained"
              startIcon={<AssessmentIcon />}
              sx={{
                bgcolor: grey[600],
                "&:hover": { bgcolor: grey[700] },
              }}
            >
              View All Exams
            </Button>
          </Link>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={3}
            sx={{
              background: `linear-gradient(135deg, ${blue[50]} 0%, ${blue[100]} 100%)`,
              border: `2px solid ${blue[200]}`,
              height: "100%",
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color={blue[700]} fontWeight="medium" gutterBottom>
                    Active Exams
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={blue[900]}>
                    {stats.activeExams}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: blue[500], width: 56, height: 56 }}>
                  <AssessmentIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={3}
            sx={{
              background: `linear-gradient(135deg, ${purple[50]} 0%, ${purple[100]} 100%)`,
              border: `2px solid ${purple[200]}`,
              height: "100%",
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color={purple[700]} fontWeight="medium" gutterBottom>
                    Total Subjects
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={purple[900]}>
                    {stats.totalSubjects}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: purple[500], width: 56, height: 56 }}>
                  <MenuBookIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={3}
            sx={{
              background: `linear-gradient(135deg, ${green[50]} 0%, ${green[100]} 100%)`,
              border: `2px solid ${green[200]}`,
              height: "100%",
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color={green[700]} fontWeight="medium" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={green[900]}>
                    {stats.completedSubjects}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: green[500], width: 56, height: 56 }}>
                  <CheckCircleIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={3}
            sx={{
              background: `linear-gradient(135deg, ${orange[50]} 0%, ${orange[100]} 100%)`,
              border: `2px solid ${orange[200]}`,
              height: "100%",
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color={orange[700]} fontWeight="medium" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={orange[900]}>
                    {stats.pendingSubjects}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: orange[500], width: 56, height: 56 }}>
                  <PendingIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Overview */}
      {stats.totalSubjects > 0 && (
        <Card
          elevation={2}
          sx={{
            mb: 4,
            background: `linear-gradient(135deg, ${blue[50]} 0%, ${purple[50]} 100%)`,
            border: `1px solid ${blue[100]}`,
          }}
        >
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" gap={1}>
                <TrendingUpIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Overall Progress
                </Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" fontWeight="medium" color="text.secondary">
                  Marks Entry Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.completedSubjects} / {stats.totalSubjects} subjects completed
                </Typography>
              </Stack>
              <Box sx={{ position: "relative", pt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={progressPercentage}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    bgcolor: grey[200],
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 6,
                      background: `linear-gradient(90deg, ${blue[500]} 0%, ${purple[500]} 100%)`,
                    },
                  }}
                />
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ textAlign: "right", mt: 1 }}
                >
                  {progressPercentage}%
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Assigned Exams List */}
      <Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          📚 Your Assigned Exams & Subjects
        </Typography>

        {assignedExams.length === 0 ? (
          <Paper elevation={0} sx={{ p: 8, textAlign: "center", bgcolor: grey[50] }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: grey[200],
                margin: "0 auto",
                mb: 2,
              }}
            >
              <AssessmentIcon sx={{ fontSize: 48, color: grey[400] }} />
            </Avatar>
            <Typography variant="h5" fontWeight="bold" color="text.secondary" gutterBottom>
              No Assigned Exams
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You don't have any exam subjects assigned for marks entry yet.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {assignedExams.map((examSubject) => (
              <Grid item xs={12} md={6} lg={4} key={`${examSubject.exam.id}-${examSubject.subject.id}`}>
                <Card
                  elevation={3}
                  sx={{
                    height: "100%",
                    border: examSubject.marksEntered
                      ? `2px solid ${green[300]}`
                      : `2px solid ${blue[300]}`,
                    bgcolor: examSubject.marksEntered ? green[50] : blue[50],
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      {/* Header */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {examSubject.exam.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Grade {examSubject.exam.grade.level} • {examSubject.exam.year} • Term{" "}
                            {examSubject.exam.term}
                          </Typography>
                        </Box>
                        <Chip
                          label={examSubject.exam.status?.replace("_", " ") || "DRAFT"}
                          color={getStatusColor(examSubject.exam.status || "DRAFT") as any}
                          size="small"
                          sx={{ fontWeight: "medium" }}
                        />
                      </Stack>

                      <Divider />

                      {/* Subject */}
                      <Stack direction="row" alignItems="center" gap={1}>
                        <SchoolIcon color="action" fontSize="small" />
                        <Typography variant="body1" fontWeight="medium">
                          {examSubject.subject.name}
                        </Typography>
                      </Stack>

                      {/* Status */}
                      {examSubject.marksEntered ? (
                        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ py: 0 }}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography variant="body2" fontWeight="medium">
                              Marks Entered
                            </Typography>
                            {examSubject.marksEnteredAt && (
                              <Typography variant="caption" color="text.secondary">
                                {new Date(examSubject.marksEnteredAt).toLocaleDateString()}
                              </Typography>
                            )}
                          </Stack>
                        </Alert>
                      ) : (
                        <Alert severity="warning" icon={<PendingIcon />} sx={{ py: 0 }}>
                          <Typography variant="body2" fontWeight="medium">
                            Marks Entry Pending
                          </Typography>
                        </Alert>
                      )}
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Stack direction="row" spacing={1} width="100%">
                      <Link
                        href={`/teacher/marks-entry/${examSubject.exam.id}`}
                        style={{ textDecoration: "none", flex: 1 }}
                      >
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={examSubject.marksEntered ? <EditIcon /> : <EditIcon />}
                          sx={{
                            bgcolor: examSubject.marksEntered ? green[600] : blue[600],
                            "&:hover": {
                              bgcolor: examSubject.marksEntered ? green[700] : blue[700],
                            },
                          }}
                        >
                          {examSubject.marksEntered ? "Update Marks" : "Enter Marks"}
                        </Button>
                      </Link>
                      <Link
                        href={`/teacher/exam-overview/${examSubject.exam.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <Tooltip title="View Exam Overview">
                          <IconButton
                            sx={{
                              border: `1px solid ${grey[300]}`,
                              "&:hover": { bgcolor: grey[100] },
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </Link>
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default TeacherMarksEntryDashboard;
