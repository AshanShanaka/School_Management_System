import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    title: "MAIN",
    items: [
      {
        icon: "/home.png",
        label: "Dashboard",
        href: "/",
        visible: ["admin", "teacher", "student", "parent"],
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/list/teachers",
        visible: ["admin"],
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        icon: "/student.png",
        label: "Students",
        href: "/list/students",
        visible: ["admin", "teacher"],
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/list/parents",
        visible: ["admin", "teacher"],
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
      {
        icon: "/class.png",
        label: "Classes",
        href: "/list/classlist",
        visible: ["admin", "teacher"],
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
      },
      {
        icon: "/class.png",
        label: "Class Teachers",
        href: "/list/class-teachers",
        visible: ["admin"],
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
    ],
  },
  {
    title: "ACADEMIC",
    items: [
      {
        icon: "/subject.png",
        label: "Subjects",
        href: "/list/subjects",
        visible: ["admin"],
        color: "text-cyan-600",
        bgColor: "bg-cyan-50",
      },
      {
        icon: "/class.png",
        label: "Grades",
        href: "/list/grades",
        visible: ["admin"],
        color: "text-violet-600",
        bgColor: "bg-violet-50",
      },
      {
        icon: "/lesson.png",
        label: "Lessons",
        href: "/list/lessons",
        visible: ["teacher"],
        color: "text-rose-600",
        bgColor: "bg-rose-50",
      },
    ],
  },
  {
    title: "ACTIVITIES",
    items: [
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/list/exams",
        visible: ["admin", "teacher", "student", "parent"],
        color: "text-red-600",
        bgColor: "bg-red-50",
      },
      {
        icon: "/result.png",
        label: "Exam Results",
        href: "/list/exam-results",
        visible: ["admin", "teacher"],
        color: "text-amber-600",
        bgColor: "bg-amber-50",
      },
      {
        icon: "/attendance.png",
        label: "Attendance",
        href: "/admin/attendance",
        visible: ["admin"],
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        icon: "/attendance.png",
        label: "Daily Attendance",
        href: "/teacher/attendance",
        visible: ["teacher"],
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        icon: "/attendance.png",
        label: "My Attendance",
        href: "/student/attendance",
        visible: ["student"],
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        icon: "/attendance.png",
        label: "Children Attendance",
        href: "/parent/attendance",
        visible: ["parent"],
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        icon: "/class.png",
        label: "My Class Teacher",
        href: "/class-teacher",
        visible: ["teacher"],
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        icon: "/update.png",
        label: "Marks Entry",
        href: "/teacher/marks-entry",
        visible: ["teacher"],
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
      },
      {
        icon: "/result.png",
        label: "Report Cards",
        href: "/teacher/generated-reports",
        visible: ["teacher"],
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        icon: "/profile.png",
        label: "My Report Cards",
        href: "/student/my-reports",
        visible: ["student", "parent"],
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        icon: "/result.png",
        label: "Report Card",
        href: "/student/report-card",
        visible: ["student"],
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        icon: "/result.png",
        label: "Child's Report Card",
        href: "/parent/report-card",
        visible: ["parent"],
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        icon: "/calendar.png",
        label: "Teacher Meetings",
        href: "/parent/meetings",
        visible: ["parent"],
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        icon: "/calendar.png",
        label: "Parent Meetings",
        href: "/class-teacher/meetings",
        visible: ["teacher"],
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        icon: "/message.png",
        label: "Messages",
        href: "/messages",
        visible: ["teacher", "student", "parent"],
        color: "text-pink-600",
        bgColor: "bg-pink-50",
      },
      {
        icon: "/assignment.png",
        label: "Assignments",
        href: "/list/assignments",
        visible: ["teacher", "student", "parent"],
        color: "text-amber-600",
        bgColor: "bg-amber-50",
      },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      {
        icon: "/result.png",
        label: "School Analytics",
        href: "/admin/analytics",
        visible: ["admin"],
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
      },
      {
        icon: "/result.png",
        label: "Class Analytics",
        href: "/class-teacher/analytics",
        visible: ["teacher"],
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        icon: "/result.png",
        label: "My Performance",
        href: "/student/performance",
        visible: ["student"],
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        icon: "/result.png",
        label: "Child Performance",
        href: "/parent/child-performance",
        visible: ["parent"],
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
    ],
  },
  {
    title: "O/L PREDICTIONS",
    items: [
      {
        icon: "/result.png",
        label: "Class O/L Analytics",
        href: "/class-teacher/ol-analytics",
        visible: ["teacher"],
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
      },
      {
        icon: "/ai-prediction.svg",
        label: "Previous Marks (9 & 10)",
        href: "/student/previous-marks",
        visible: ["student"],
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        icon: "/result.png",
        label: "My O/L Prediction",
        href: "/student/ol-prediction",
        visible: ["student"],
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
      },
      {
        icon: "/result.png",
        label: "Child O/L Prediction",
        href: "/parent/ol-prediction",
        visible: ["parent"],
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
      },
    ],
  },
  {
    title: "RESULTS",
    items: [
      {
        icon: "/result.png",
        label: "My Results",
        href: "/student/my-results",
        visible: ["student"],
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        icon: "/result.png",
        label: "Children Results",
        href: "/parent/my-results",
        visible: ["parent"],
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        icon: "/result.png",
        label: "Previous Marks Records",
        href: "/admin/previous-marks-records",
        visible: ["admin"],
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        icon: "/update.png",
        label: "Import Historical Marks",
        href: "/admin/historical-marks-import",
        visible: ["admin"],
        color: "text-amber-600",
        bgColor: "bg-amber-50",
      },
      {
        icon: "/update.png",
        label: "Import Historical Marks",
        href: "/teacher/historical-marks-import",
        visible: ["teacher"],
        color: "text-amber-600",
        bgColor: "bg-amber-50",
      },
      {
        icon: "/view.png",
        label: "View Historical Marks",
        href: "/teacher/view-historical-marks",
        visible: ["teacher"],
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
      },
    ],
  },
  {
    title: "TOOLS",
    items: [
      {
        icon: "/upload.png",
        label: "CSV Import",
        href: "/admin/import",
        visible: ["admin"],
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/list/events",
        visible: ["admin", "teacher", "student", "parent"],
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["admin", "teacher", "student", "parent"],
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
    ],
  },
  // Removed SETTINGS section - Profile, Settings, Logout now in navbar dropdown
];

const Menu = async () => {
  const user = await getCurrentUser();
  const role = user?.role || "";

  // Debug: Log user information
  console.log("Menu component - User:", user);
  console.log("Menu component - Role:", role);

  // Create role-specific dashboard href
  const getDashboardHref = (userRole: string) => {
    switch (userRole) {
      case "admin":
        return "/admin";
      case "teacher":
        return "/teacher";
      case "student":
        return "/student";
      case "parent":
        return "/parent";
      default:
        return "/";
    }
  };

  // Create role-specific menu items with dynamic dashboard link
  const getMenuItems = (userRole: string) => {
    const dashboardHref = getDashboardHref(userRole);
    
    return menuItems.map((section) => {
      if (section.title === "MAIN") {
        return {
          ...section,
          items: section.items.map((item) => {
            if (item.label === "Dashboard") {
              return {
                ...item,
                href: dashboardHref,
              };
            }
            return item;
          }),
        };
      }
      return section;
    });
  };

  // Create role-specific menu items
  // Get role-specific events href
  const getEventsHref = (userRole: string) => {
    switch (userRole) {
      case "admin":
        return "/admin/events";
      default:
        return "/list/events";
    }
  };

  // Get role-specific announcements href
  const getAnnouncementsHref = (userRole: string) => {
    switch (userRole) {
      case "admin":
        return "/admin/announcements";
      default:
        return "/list/announcements";
    }
  };

  // Update menu items with dynamic links
  const dynamicMenuItems = getMenuItems(role).map((section) => {
    if (section.title === "TOOLS") {
      return {
        ...section,
        items: section.items.map((item) => {
          if (item.label === "Events") {
            return {
              ...item,
              href: getEventsHref(role),
            };
          }
          if (item.label === "Announcements") {
            return {
              ...item,
              href: getAnnouncementsHref(role),
            };
          }
          return item;
        }),
      };
    }
    return section;
  });

  return (
    <nav className="mt-6 space-y-8">
      {dynamicMenuItems.map((section) => (
        <div key={section.title} className="space-y-3">
          <div className="px-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:block">
              {section.title}
            </h3>
          </div>
          <ul className="space-y-1">
            {section.items?.map((item) => {
              if (!role || item.visible.includes(role)) {
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="group flex items-center justify-center lg:justify-start gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 hover:shadow-sm relative overflow-hidden"
                    >
                      {/* Background with gradient effect */}
                      <span
                        className={`absolute inset-0 ${item.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl`}
                      ></span>

                      {/* Icon container with color styling */}
                      <span
                        className={`relative z-10 w-9 h-9 rounded-lg ${item.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                      >
                        <Image
                          src={item.icon}
                          alt=""
                          width={18}
                          height={18}
                          className="filter group-hover:brightness-110"
                        />
                      </span>

                      {/* Label with modern typography */}
                      <span
                        className={`relative z-10 hidden lg:block font-medium text-gray-700 group-hover:${item.color} group-hover:translate-x-1 transition-all duration-200`}
                      >
                        {item.label}
                      </span>

                      {/* Hover indicator */}
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                    </Link>
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
};

export default Menu;
