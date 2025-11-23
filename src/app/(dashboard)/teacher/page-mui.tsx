import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Announcements from "@/components/Announcements";
import { 
  Container, 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardActions,
  Avatar, 
  Stack, 
  Chip,
  LinearProgress,
  Paper,
  Button,
  IconButton,
  Divider
} from '@mui/material';
import { 
  blue, 
  purple, 
  green, 
  orange, 
  red,
  indigo,
  grey 
} from '@mui/material/colors';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuizIcon from '@mui/icons-material/Quiz';
import MessageIcon from '@mui/icons-material/Message';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const TeacherPage = async () => {
  const { userId } = await auth();

  // Get teacher data with all relations
  const teacher = await prisma.teacher.findUnique({
    where: { id: userId! },
    include: {
      _count: {
        select: {
          subjects: true,
          lessons: true,
          classes: true,
        },
      },
      classes: {
        include: {
          grade: true,
          _count: {
            select: {
              students: true,
            },
          },
        },
      },
      subjects: true,
    },
  });

  // Get supervised classes
  const supervisedClasses = await prisma.class.findMany({
    where: {
      supervisorId: userId!,
    },
    include: {
      grade: true,
      _count: {
        select: {
          students: true,
        },
      },
      students: {
        include: {
          attendances: {
            where: {
              date: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      },
    },
  });

  // Get total students across all classes
  const totalStudents = teacher?.classes.reduce((sum, cls) => {
    return sum + cls._count.students;
  }, 0) || 0;

  const supervisedClassCount = supervisedClasses.length;

  // Get today's lessons
  const today = new Date();
  const dayOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][today.getDay()];

  const todaysLessons = await prisma.lesson.findMany({
    where: {
      teacherId: userId!,
      day: dayOfWeek as any,
    },
    include: {
      subject: true,
      class: {
        include: {
          grade: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${blue[600]} 0%, ${purple[600]} 100%)`,
          borderRadius: 3,
          p: 4,
          mb: 4,
          color: 'white',
          boxShadow: 3,
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center">
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'white',
              color: blue[700],
              fontSize: '2rem',
              fontWeight: 'bold',
            }}
          >
            {teacher?.name?.charAt(0) || 'T'}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Welcome, {teacher?.name || 'Teacher'}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {teacher?.email || ''}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip 
                label="Teacher" 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontWeight: 'medium'
                }} 
              />
              {supervisedClassCount > 0 && (
                <Chip 
                  label={`${supervisedClassCount} Class Supervisor`}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 'medium'
                  }}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: supervisedClassCount > 0 ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)'
          },
          gap: 3,
          mb: 4
        }}
      >
        {/* Total Classes */}
        <Card 
          elevation={3}
          sx={{
            background: `linear-gradient(135deg, ${blue[50]} 0%, ${blue[100]} 100%)`,
            border: `2px solid ${blue[200]}`,
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
            },
          }}
        >
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="body2" color={blue[700]} fontWeight="medium" gutterBottom>
                  Total Classes
                </Typography>
                <Typography variant="h3" fontWeight="bold" color={blue[900]}>
                  {teacher?._count.classes || 0}
                </Typography>
                <Typography variant="caption" color={blue[600]} sx={{ mt: 1, display: 'block' }}>
                  Teaching classes
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: blue[500], width: 56, height: 56 }}>
                <ClassIcon sx={{ fontSize: 32 }} />
              </Avatar>
            </Stack>
          </CardContent>
        </Card>

        {/* Total Students */}
        <Card 
          elevation={3}
          sx={{
            background: `linear-gradient(135deg, ${purple[50]} 0%, ${purple[100]} 100%)`,
            border: `2px solid ${purple[200]}`,
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
            },
          }}
        >
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="body2" color={purple[700]} fontWeight="medium" gutterBottom>
                  Total Students
                </Typography>
                <Typography variant="h3" fontWeight="bold" color={purple[900]}>
                  {totalStudents}
                </Typography>
                <Typography variant="caption" color={purple[600]} sx={{ mt: 1, display: 'block' }}>
                  Across all classes
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: purple[500], width: 56, height: 56 }}>
                <PeopleIcon sx={{ fontSize: 32 }} />
              </Avatar>
            </Stack>
          </CardContent>
        </Card>

        {/* Total Subjects */}
        <Card 
          elevation={3}
          sx={{
            background: `linear-gradient(135deg, ${green[50]} 0%, ${green[100]} 100%)`,
            border: `2px solid ${green[200]}`,
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
            },
          }}
        >
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="body2" color={green[700]} fontWeight="medium" gutterBottom>
                  Subjects
                </Typography>
                <Typography variant="h3" fontWeight="bold" color={green[900]}>
                  {teacher?._count.subjects || 0}
                </Typography>
                <Typography variant="caption" color={green[600]} sx={{ mt: 1, display: 'block' }}>
                  Teaching subjects
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: green[500], width: 56, height: 56 }}>
                <MenuBookIcon sx={{ fontSize: 32 }} />
              </Avatar>
            </Stack>
          </CardContent>
        </Card>

        {/* Total Lessons */}
        <Card 
          elevation={3}
          sx={{
            background: `linear-gradient(135deg, ${orange[50]} 0%, ${orange[100]} 100%)`,
            border: `2px solid ${orange[200]}`,
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
            },
          }}
        >
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="body2" color={orange[700]} fontWeight="medium" gutterBottom>
                  Weekly Lessons
                </Typography>
                <Typography variant="h3" fontWeight="bold" color={orange[900]}>
                  {teacher?._count.lessons || 0}
                </Typography>
                <Typography variant="caption" color={orange[600]} sx={{ mt: 1, display: 'block' }}>
                  Scheduled lessons
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: orange[500], width: 56, height: 56 }}>
                <SchoolIcon sx={{ fontSize: 32 }} />
              </Avatar>
            </Stack>
          </CardContent>
        </Card>

        {/* Supervised Classes Badge */}
        {supervisedClassCount > 0 && (
          <Card 
            elevation={3}
            sx={{
              background: `linear-gradient(135deg, ${indigo[50]} 0%, ${indigo[100]} 100%)`,
              border: `2px solid ${indigo[200]}`,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color={indigo[700]} fontWeight="medium" gutterBottom>
                    Class Supervisor
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color={indigo[900]}>
                    {supervisedClassCount}
                  </Typography>
                  <Typography variant="caption" color={indigo[600]} sx={{ mt: 1, display: 'block' }}>
                    Supervised classes
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: indigo[500], width: 56, height: 56 }}>
                  <CheckCircleIcon sx={{ fontSize: 32 }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" color={grey[800]} gutterBottom sx={{ mb: 3 }}>
          Quick Actions
        </Typography>
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)'
            },
            gap: 3
          }}
        >
          {/* Take Attendance */}
          <Card 
            elevation={2}
            component={Link}
            href="/teacher/attendance/timetable"
            sx={{
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
                borderColor: green[300],
              },
              border: `1px solid ${grey[200]}`,
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: green[100], width: 56, height: 56 }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: green[600] }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color={grey[800]}>
                    Take Attendance
                  </Typography>
                  <Typography variant="body2" color={grey[600]}>
                    Mark student attendance for your classes
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* View Timetable */}
          <Card 
            elevation={2}
            component={Link}
            href="/teacher/timetable"
            sx={{
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
                borderColor: blue[300],
              },
              border: `1px solid ${grey[200]}`,
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: blue[100], width: 56, height: 56 }}>
                  <CalendarTodayIcon sx={{ fontSize: 32, color: blue[600] }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color={grey[800]}>
                    View Timetable
                  </Typography>
                  <Typography variant="body2" color={grey[600]}>
                    Check your teaching schedule
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Manage Assignments */}
          <Card 
            elevation={2}
            component={Link}
            href="/list/assignments"
            sx={{
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
                borderColor: purple[300],
              },
              border: `1px solid ${grey[200]}`,
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: purple[100], width: 56, height: 56 }}>
                  <AssignmentIcon sx={{ fontSize: 32, color: purple[600] }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color={grey[800]}>
                    Manage Assignments
                  </Typography>
                  <Typography variant="body2" color={grey[600]}>
                    Create and grade assignments
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Exam Management */}
          <Card 
            elevation={2}
            component={Link}
            href="/list/exams"
            sx={{
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
                borderColor: red[300],
              },
              border: `1px solid ${grey[200]}`,
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: red[100], width: 56, height: 56 }}>
                  <QuizIcon sx={{ fontSize: 32, color: red[600] }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color={grey[800]}>
                    Exam Management
                  </Typography>
                  <Typography variant="body2" color={grey[600]}>
                    Schedule and manage exams
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card 
            elevation={2}
            component={Link}
            href="/list/messages"
            sx={{
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
                borderColor: indigo[300],
              },
              border: `1px solid ${grey[200]}`,
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: indigo[100], width: 56, height: 56 }}>
                  <MessageIcon sx={{ fontSize: 32, color: indigo[600] }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color={grey[800]}>
                    Messages
                  </Typography>
                  <Typography variant="body2" color={grey[600]}>
                    Communicate with students and parents
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Today's Schedule & Classes */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'repeat(2, 1fr)'
          },
          gap: 3,
          mb: 4
        }}
      >
        {/* Today's Lessons */}
        <Card elevation={3}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <CalendarTodayIcon sx={{ color: blue[600] }} />
              <Typography variant="h6" fontWeight="bold" color={grey[800]}>
                Today's Lessons
              </Typography>
            </Stack>
            <Stack spacing={2}>
              {todaysLessons.length > 0 ? (
                todaysLessons.map((lesson) => (
                  <Paper
                    key={lesson.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: grey[50],
                      borderRadius: 2,
                      border: `1px solid ${grey[200]}`,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body1" fontWeight="medium" color={grey[800]}>
                          {lesson.subject.name}
                        </Typography>
                        <Typography variant="body2" color={grey[600]}>
                          {lesson.class.name} ({lesson.class.grade.level})
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight="medium" color={blue[600]}>
                          {lesson.startTime.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                        <Typography variant="caption" color={grey[500]}>
                          {lesson.endTime.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Avatar 
                    sx={{ 
                      width: 64, 
                      height: 64, 
                      bgcolor: grey[100], 
                      mx: 'auto', 
                      mb: 2 
                    }}
                  >
                    <CalendarTodayIcon sx={{ fontSize: 32, color: grey[400] }} />
                  </Avatar>
                  <Typography variant="body2" color={grey[500]}>
                    No lessons scheduled for today
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* My Classes */}
        <Card elevation={3}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <ClassIcon sx={{ color: purple[600] }} />
              <Typography variant="h6" fontWeight="bold" color={grey[800]}>
                My Classes
              </Typography>
            </Stack>
            <Stack spacing={2}>
              {teacher?.classes && teacher.classes.length > 0 ? (
                teacher.classes.map((cls) => (
                  <Paper
                    key={cls.id}
                    component={Link}
                    href={`/list/students?classId=${cls.id}`}
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: grey[50],
                      borderRadius: 2,
                      border: `1px solid ${grey[200]}`,
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: blue[50],
                        borderColor: blue[200],
                        cursor: 'pointer',
                      },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body1" fontWeight="medium" color={grey[800]}>
                          {cls.name}
                        </Typography>
                        <Typography variant="body2" color={grey[600]}>
                          Grade {cls.grade.level}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight="medium" color={blue[600]}>
                          {cls._count.students} students
                        </Typography>
                        <Typography variant="caption" color={grey[500]}>
                          View Details →
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Avatar 
                    sx={{ 
                      width: 64, 
                      height: 64, 
                      bgcolor: grey[100], 
                      mx: 'auto', 
                      mb: 2 
                    }}
                  >
                    <ClassIcon sx={{ fontSize: 32, color: grey[400] }} />
                  </Avatar>
                  <Typography variant="body2" color={grey[500]}>
                    No classes assigned
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Supervised Classes Section */}
      {supervisedClasses && supervisedClasses.length > 0 && (
        <Card elevation={3} id="supervised-classes" sx={{ mb: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <TrendingUpIcon sx={{ color: green[600] }} />
              <Typography variant="h6" fontWeight="bold" color={grey[800]}>
                Classes I Supervise
              </Typography>
            </Stack>
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)'
                },
                gap: 3
              }}
            >
              {supervisedClasses.map((cls) => {
                // Calculate attendance rate for last 7 days
                const totalStudents = cls._count.students;
                const totalAttendanceRecords = cls.students.reduce(
                  (sum, student) => sum + student.attendances.length,
                  0
                );
                const presentRecords = cls.students.reduce(
                  (sum, student) =>
                    sum +
                    student.attendances.filter((att) => att.present).length,
                  0
                );
                const attendanceRate =
                  totalAttendanceRecords > 0
                    ? Math.round((presentRecords / totalAttendanceRecords) * 100)
                    : 0;

                return (
                  <Card
                    key={cls.id}
                    component={Link}
                    href={`/list/students?classId=${cls.id}`}
                    elevation={2}
                    sx={{
                      textDecoration: 'none',
                      border: `1px solid ${grey[200]}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: blue[300],
                        bgcolor: blue[50],
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        cursor: 'pointer',
                      },
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold" color={grey[800]}>
                          {cls.name}
                        </Typography>
                        <Chip 
                          label="Supervisor" 
                          size="small" 
                          sx={{ 
                            bgcolor: green[100], 
                            color: green[800],
                            fontWeight: 'medium',
                            fontSize: '0.7rem'
                          }} 
                        />
                      </Stack>
                      <Typography variant="body2" color={grey[600]} sx={{ mb: 3 }}>
                        Grade {cls.grade.level} • {totalStudents} students
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="caption" color={grey[600]}>
                            Attendance (7 days)
                          </Typography>
                          <Typography variant="caption" fontWeight="medium" color={grey[800]}>
                            {attendanceRate}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={attendanceRate}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: grey[200],
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 4,
                              bgcolor: attendanceRate >= 80
                                ? green[500]
                                : attendanceRate >= 60
                                ? orange[500]
                                : red[500],
                            },
                          }}
                        />
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Stack direction="row" justifyContent="space-between">
                        <Button
                          component={Link}
                          href="/teacher/timetable"
                          size="small"
                          sx={{ 
                            textTransform: 'none',
                            color: blue[600],
                            fontSize: '0.75rem'
                          }}
                        >
                          View Timetable →
                        </Button>
                        <Typography variant="caption" color={grey[500]} sx={{ alignSelf: 'center' }}>
                          Manage Class →
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Announcements */}
      <Card elevation={3}>
        <Announcements />
      </Card>
    </Container>
  );
};

export default TeacherPage;
