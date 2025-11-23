import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

// Simplified and grouped menu items for professional admin panel
const adminMenuItems = [
  {
    title: "MAIN",
    items: [
      { icon: "/home.png", label: "Dashboard", href: "/admin", color: "blue" },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { icon: "/teacher.png", label: "Teachers", href: "/list/teachers", color: "purple" },
      { icon: "/student.png", label: "Students", href: "/list/students", color: "green" },
      { icon: "/parent.png", label: "Parents", href: "/list/parents", color: "orange" },
      { icon: "/class.png", label: "Classes", href: "/list/classlist", color: "indigo" },
    ],
  },
  {
    title: "ACADEMIC",
    items: [
      { icon: "/subject.png", label: "Subjects", href: "/list/subjects", color: "cyan" },
      { icon: "/calendar.png", label: "Timetables", href: "/admin/timetable", color: "emerald" },
      { icon: "/exam.png", label: "Exams", href: "/list/exams", color: "red" },
      { icon: "/result.png", label: "Exam Results", href: "/list/exam-results", color: "amber" },
      { icon: "/attendance.png", label: "Attendance", href: "/admin/attendance", color: "green" },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { icon: "/result.png", label: "School Analytics", href: "/admin/analytics", color: "indigo" },
    ],
  },
  {
    title: "RESULTS",
    items: [
      { icon: "/result.png", label: "Previous Marks Records", href: "/admin/previous-marks-records", color: "purple" },
      { icon: "/update.png", label: "Import Historical Marks", href: "/admin/historical-marks-import", color: "amber" },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { icon: "/upload.png", label: "CSV Import", href: "/admin/import", color: "blue" },
      { icon: "/calendar.png", label: "Events", href: "/admin/events", color: "green" },
      { icon: "/announcement.png", label: "Announcements", href: "/list/announcements", color: "orange" },
    ],
  },
];

const teacherMenuItems = [
  {
    title: "MAIN",
    items: [
      { icon: "/home.png", label: "Dashboard", href: "/teacher", color: "blue" },
    ],
  },
  {
    title: "MY WORK",
    items: [
      { icon: "/student.png", label: "Students", href: "/list/students", color: "green" },
      { icon: "/parent.png", label: "Parents", href: "/list/parents", color: "orange" },
      { icon: "/class.png", label: "Classes", href: "/list/classlist", color: "indigo" },
      { icon: "/lesson.png", label: "Lessons", href: "/list/lessons", color: "rose" },
    ],
  },
  {
    title: "ACTIVITIES",
    items: [
      { icon: "/update.png", label: "Marks Entry", href: "/teacher/marks-entry", color: "indigo" },
      { icon: "/result.png", label: "Report Cards", href: "/teacher/generated-reports", color: "purple" },
      { icon: "/attendance.png", label: "Attendance", href: "/teacher/attendance", color: "green" },
      { icon: "/calendar.png", label: "Parent Meetings", href: "/class-teacher/meetings", color: "violet" },
    ],
  },
  {
    title: "RESOURCES",
    items: [
      { icon: "/calendar.png", label: "Timetable", href: "/teacher/school-timetable", color: "emerald" },
      { icon: "/exam.png", label: "Exams", href: "/list/exams", color: "red" },
      { icon: "/assignment.png", label: "Assignments", href: "/list/assignments", color: "amber" },
      { icon: "/message.png", label: "Messages", href: "/messages", color: "pink" },
    ],
  },
  {
    title: "O/L PREDICTIONS",
    items: [
      { icon: "/result.png", label: "Class O/L Analytics", href: "/class-teacher/ol-analytics", color: "indigo" },
      { icon: "/update.png", label: "Import Historical Marks", href: "/teacher/historical-marks-import", color: "amber" },
      { icon: "/view.png", label: "View Historical Marks", href: "/teacher/view-historical-marks", color: "purple" },
    ],
  },
];

const studentMenuItems = [
  {
    title: "MAIN",
    items: [
      { icon: "/home.png", label: "Dashboard", href: "/student", color: "blue" },
    ],
  },
  {
    title: "MY LEARNING",
    items: [
      { icon: "/assignment.png", label: "Assignments", href: "/list/assignments", color: "amber" },
      { icon: "/result.png", label: "My Results", href: "/student/my-results", color: "teal" },
      { icon: "/result.png", label: "Report Card", href: "/student/report-card", color: "blue" },
      { icon: "/attendance.png", label: "My Attendance", href: "/student/attendance", color: "green" },
    ],
  },
  {
    title: "SCHEDULE",
    items: [
      { icon: "/calendar.png", label: "Timetable", href: "/student/timetable", color: "emerald" },
      { icon: "/exam.png", label: "Exams", href: "/list/exams", color: "red" },
      { icon: "/calendar.png", label: "Events", href: "/list/events", color: "purple" },
      { icon: "/message.png", label: "Messages", href: "/messages", color: "pink" },
    ],
  },
  {
    title: "O/L PREDICTION",
    items: [
      { icon: "/ai-prediction.svg", label: "Previous Marks (9 & 10)", href: "/student/previous-marks", color: "purple" },
      { icon: "/result.png", label: "My O/L Prediction", href: "/student/ol-prediction", color: "indigo" },
    ],
  },
];

const parentMenuItems = [
  {
    title: "MAIN",
    items: [
      { icon: "/home.png", label: "Dashboard", href: "/parent", color: "blue" },
    ],
  },
  {
    title: "MY CHILDREN",
    items: [
      { icon: "/student.png", label: "Children", href: "/parent/children", color: "green" },
      { icon: "/result.png", label: "Report Cards", href: "/parent/report-card", color: "blue" },
      { icon: "/calendar.png", label: "Meetings", href: "/parent/meetings", color: "purple" },
    ],
  },
  {
    title: "INFORMATION",
    items: [
      { icon: "/calendar.png", label: "Timetable", href: "/parent/timetable", color: "emerald" },
      { icon: "/exam.png", label: "Exams", href: "/list/exams", color: "red" },
      { icon: "/assignment.png", label: "Assignments", href: "/list/assignments", color: "amber" },
      { icon: "/result.png", label: "Children Results", href: "/student/my-results", color: "teal" },
      { icon: "/message.png", label: "Messages", href: "/messages", color: "violet" },
      { icon: "/calendar.png", label: "Events", href: "/list/events", color: "orange" },
    ],
  },
  {
    title: "O/L PREDICTION",
    items: [
      { icon: "/result.png", label: "Child O/L Prediction", href: "/parent/ol-prediction", color: "indigo" },
    ],
  },
];

const MenuCompact = async () => {
  const user = await getCurrentUser();
  const role = user?.role || "";

  // Select menu items based on role
  let menuItems = [];
  switch (role) {
    case "admin":
      menuItems = adminMenuItems;
      break;
    case "teacher":
      menuItems = teacherMenuItems;
      break;
    case "student":
      menuItems = studentMenuItems;
      break;
    case "parent":
      menuItems = parentMenuItems;
      break;
    default:
      menuItems = [];
  }

  return (
    <nav className="px-2 space-y-1">
      {menuItems.map((section) => (
        <div key={section.title} className="py-2">
          {/* Section Title - Minimal */}
          <div className="px-3 mb-2">
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:block">
              {section.title}
            </h3>
          </div>

          {/* Menu Items - Clean & Simple */}
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <Link
                href={item.href}
                key={item.label}
                className="group flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-lg transition-all duration-150 hover:bg-gray-100 relative"
                title={item.label}
              >
                {/* Simple Icon */}
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={20}
                    height={20}
                    className="opacity-70 group-hover:opacity-100 transition-opacity duration-150"
                  />
                </div>

                {/* Clean Label */}
                <span className="hidden lg:block text-sm font-normal text-gray-700 group-hover:text-gray-900 transition-colors duration-150">
                  {item.label}
                </span>

                {/* Active Indicator - Minimal */}
                <div className="absolute left-0 w-0.5 h-5 bg-blue-600 rounded-r opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
};

export default MenuCompact;
