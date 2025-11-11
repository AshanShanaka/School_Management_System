import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import AIPredictionIcon from "@/components/icons/AIPredictionIcon";

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
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { icon: "/attendance.png", label: "Attendance", href: "/admin/attendance", color: "pink" },
      { icon: "/result.png", label: "Results", href: "/list/results", color: "teal" },
      { icon: "/message.png", label: "Messages", href: "/messages", color: "violet" },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { icon: "/upload.png", label: "CSV Import", href: "/admin/import", color: "blue" },
      { icon: "/ai-prediction.svg", label: "AI Predictions", href: "/admin/predictions", color: "purple" },
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
      { icon: "/attendance.png", label: "Take Attendance", href: "/teacher/attendance/timetable", color: "green" },
      { icon: "/update.png", label: "Marks Entry", href: "/teacher/marks-entry", color: "indigo" },
      { icon: "/result.png", label: "Class Reports", href: "/teacher/class-reports", color: "purple" },
      { icon: "/result.png", label: "Report Cards", href: "/teacher/report-card", color: "blue" },
    ],
  },
  {
    title: "RESOURCES",
    items: [
      { icon: "/calendar.png", label: "Timetable", href: "/teacher/school-timetable", color: "emerald" },
      { icon: "/exam.png", label: "Exams", href: "/list/exams", color: "red" },
      { icon: "/assignment.png", label: "Assignments", href: "/list/assignments", color: "amber" },
      { icon: "/result.png", label: "Results", href: "/list/results", color: "teal" },
      { icon: "/message.png", label: "Messages", href: "/messages", color: "pink" },
      { icon: "/ai-prediction.svg", label: "AI Predictions", href: "/teacher/predictions", color: "purple" },
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
      { icon: "/attendance.png", label: "My Attendance", href: "/student/attendance", color: "green" },
      { icon: "/assignment.png", label: "Assignments", href: "/list/assignments", color: "amber" },
      { icon: "/result.png", label: "Results", href: "/list/results", color: "teal" },
      { icon: "/result.png", label: "Report Card", href: "/student/report-card", color: "blue" },
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
      { icon: "/attendance.png", label: "Attendance", href: "/parent/attendance", color: "pink" },
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
      { icon: "/result.png", label: "Results", href: "/list/results", color: "teal" },
      { icon: "/message.png", label: "Messages", href: "/messages", color: "violet" },
      { icon: "/calendar.png", label: "Events", href: "/list/events", color: "orange" },
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
                  {item.label === "AI Predictions" ? (
                    <AIPredictionIcon size={20} className="opacity-70 group-hover:opacity-100 transition-opacity duration-150" />
                  ) : (
                    <Image
                      src={item.icon}
                      alt={item.label}
                      width={20}
                      height={20}
                      className="opacity-70 group-hover:opacity-100 transition-opacity duration-150"
                    />
                  )}
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
