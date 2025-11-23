"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "si";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "menu.home": "Home",
    "menu.students": "Students",
    "menu.teachers": "Teachers",
    "menu.parents": "Parents",
    "menu.subjects": "Subjects",
    "menu.classes": "Classes",
    "menu.lessons": "Lessons",
    "menu.exams": "Exams",
    "menu.assignments": "Assignments",
    "menu.results": "Results",
    "menu.attendance": "Attendance",
    "menu.events": "Events",
    "menu.messages": "Messages",
    "menu.announcements": "Announcements",
    "menu.profile": "Profile",
    "menu.settings": "Settings",
    "menu.logout": "Logout",
    "menu.reportCards": "Report Cards",
    "menu.myChildren": "My Children",
    "menu.meetings": "Meetings",
    "menu.calendar": "Calendar",
    
    // Dashboard
    "dashboard.welcome": "Welcome",
    "dashboard.overview": "Dashboard Overview",
    "dashboard.statistics": "Statistics",
    "dashboard.recentActivities": "Recent Activities",
    "dashboard.upcomingEvents": "Upcoming Events",
    "dashboard.notifications": "Notifications",
    "dashboard.viewAll": "View All",
    "dashboard.noData": "No data available",
    
    // Children
    "children.title": "My Children",
    "children.subtitle": "Manage and monitor your children's information",
    "children.name": "Name",
    "children.class": "Class",
    "children.grade": "Grade",
    "children.attendance": "Attendance",
    "children.performance": "Performance",
    "children.viewDetails": "View Details",
    "children.noChildren": "No children found",
    
    // Attendance
    "attendance.title": "Attendance",
    "attendance.present": "Present",
    "attendance.absent": "Absent",
    "attendance.late": "Late",
    "attendance.excused": "Excused",
    "attendance.attendanceRate": "Attendance Rate",
    "attendance.totalDays": "Total Days",
    "attendance.presentDays": "Present Days",
    "attendance.absentDays": "Absent Days",
    "attendance.viewHistory": "View History",
    "attendance.date": "Date",
    "attendance.status": "Status",
    "attendance.reason": "Reason",
    
    // Announcements
    "announcements.title": "Announcements",
    "announcements.subtitle": "Latest updates and notifications",
    "announcements.postedBy": "Posted by",
    "announcements.postedOn": "Posted on",
    "announcements.readMore": "Read More",
    "announcements.noAnnouncements": "No announcements available",
    
    // Report Cards
    "reportCard.title": "Children's Report Cards",
    "reportCard.subtitle": "Monitor your children's academic performance",
    "reportCard.totalReports": "Total Report Cards",
    "reportCard.filterByChild": "Filter by Child:",
    "reportCard.allChildren": "All Children",
    "reportCard.noReportsYet": "No Report Cards Yet",
    "reportCard.noReportsMessage": "Report cards will appear here once teachers generate them.",
    "reportCard.clickToView": "Click on any report card to view detailed results",
    "reportCard.viewDetails": "View Details",
    "reportCard.loading": "Loading report cards...",
    "reportCard.errorLoading": "Error Loading Report Cards",
    "reportCard.tryAgain": "Try Again",
    "reportCard.goBack": "Go Back",
    
    // Report Card Details
    "reportCard.header": "REPORT CARD",
    "reportCard.academicYear": "Academic Year",
    "reportCard.name": "Name:",
    "reportCard.indexNo": "Index No:",
    "reportCard.grade": "Grade:",
    "reportCard.examination": "Examination:",
    "reportCard.year": "Year:",
    "reportCard.term": "Term:",
    "reportCard.subject": "Subject",
    "reportCard.marks": "Marks (%)",
    "reportCard.gradeColumn": "Grade",
    "reportCard.performanceSummary": "Performance Summary",
    "reportCard.totalMarksObtained": "Total Marks Obtained:",
    "reportCard.averagePercentage": "Average Percentage:",
    "reportCard.classPosition": "Class Position",
    "reportCard.classRank": "Class Rank:",
    "reportCard.totalStudents": "Total Students:",
    "reportCard.subjectsAverage": "Subjects Average:",
    "reportCard.notRankedYet": "Not Ranked Yet",
    "reportCard.printButton": "🖨️ Print Report Card",
    "reportCard.backButton": "← Back to Reports",
    "reportCard.reportGenerated": "Report Generated:",
    "reportCard.keepStriving": "Keep striving for excellence!",
    
    // Common
    "common.year": "Year",
    "common.term": "Term",
    "common.percentage": "Percentage:",
    "common.rank": "Rank:",
    "common.marksObtained": "Marks:",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.sort": "Sort",
    "common.export": "Export",
    "common.print": "Print",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.download": "Download",
    "common.upload": "Upload",
    "common.close": "Close",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.submit": "Submit",
    "common.loading": "Loading...",
    "common.success": "Success",
    "common.error": "Error",
    "common.warning": "Warning",
    "common.info": "Information",
    "common.yes": "Yes",
    "common.no": "No",
    
    // Parent Dashboard
    "parent.welcomeBack": "Welcome back",
    "parent.dashboardSubtitle": "Monitor your children's progress",
    "parent.myChildren": "My Children",
    "parent.enrolledChildren": "Enrolled children",
    "parent.attendanceRate": "Attendance Rate",
    "parent.last7Days": "Last 7 days",
    "parent.upcomingExams": "Upcoming Exams",
    "parent.thisMonth": "This month",
    "parent.messages": "Messages",
    "parent.unreadMessages": "Unread messages",
    "parent.quickActions": "Quick Actions",
    "parent.childrenAttendance": "Children Attendance",
    "parent.viewDetailedAttendance": "View detailed attendance records",
    "parent.academicResults": "Academic Results",
    "parent.viewExamResults": "View exam results and grades",
    "parent.timetable": "Timetable",
    "parent.checkClassSchedules": "Check class schedules",
    "parent.assignments": "Assignments",
    "parent.trackHomework": "Track homework and assignments",
    "parent.schoolEvents": "School Events",
    "parent.stayUpdated": "Stay updated with school events",
    "parent.contactTeachers": "Contact Teachers",
    "parent.sendMessages": "Send messages to teachers",
    "parent.recentAttendance": "Recent Attendance",
    "parent.last5Days": "Last 5 days",
    "parent.viewDetails": "View Details",
    "parent.fullProfile": "Full Profile",
    "parent.noChildrenRegistered": "No children registered",
    "parent.noRecentAttendance": "No recent attendance records",
    "parent.notScheduled": "Not scheduled",
    "parent.at": "at",
  },
  si: {
    // Navigation (Sinhala)
    "menu.home": "මුල් පිටුව",
    "menu.students": "සිසුන්",
    "menu.teachers": "ගුරුවරු",
    "menu.parents": "දෙමාපියන්",
    "menu.subjects": "විෂයයන්",
    "menu.classes": "පන්ති",
    "menu.lessons": "පාඩම්",
    "menu.exams": "විභාග",
    "menu.assignments": "පැවරුම්",
    "menu.results": "ප්‍රතිඵල",
    "menu.attendance": "පැමිණීම",
    "menu.events": "සිදුවීම්",
    "menu.messages": "පණිවුඩ",
    "menu.announcements": "නිවේදන",
    "menu.profile": "පැතිකඩ",
    "menu.settings": "සැකසුම්",
    "menu.logout": "පිටවීම",
    "menu.reportCards": "ප්‍රගති වාර්තා",
    "menu.myChildren": "මගේ දරුවන්",
    "menu.meetings": "රැස්වීම්",
    "menu.calendar": "දින දර්ශනය",
    
    // Dashboard (Sinhala)
    "dashboard.welcome": "ආයුබෝවන්",
    "dashboard.overview": "උපකරණ පුවරුව",
    "dashboard.statistics": "සංඛ්‍යාලේඛන",
    "dashboard.recentActivities": "මෑත ක්‍රියාකාරකම්",
    "dashboard.upcomingEvents": "ඉදිරි සිදුවීම්",
    "dashboard.notifications": "දැනුම්දීම්",
    "dashboard.viewAll": "සියල්ල බලන්න",
    "dashboard.noData": "දත්ත නොමැත",
    
    // Children (Sinhala)
    "children.title": "මගේ දරුවන්",
    "children.subtitle": "ඔබේ දරුවන්ගේ තොරතුරු කළමනාකරණය සහ නිරීක්ෂණය කරන්න",
    "children.name": "නම",
    "children.class": "පන්තිය",
    "children.grade": "ශ්‍රේණිය",
    "children.attendance": "පැමිණීම",
    "children.performance": "කාර්ය සාධනය",
    "children.viewDetails": "විස්තර බලන්න",
    "children.noChildren": "දරුවන් හමු නොවීය",
    
    // Attendance (Sinhala)
    "attendance.title": "පැමිණීම",
    "attendance.present": "පැමිණ සිටි",
    "attendance.absent": "නොපැමිණි",
    "attendance.late": "ප්‍රමාද",
    "attendance.excused": "නිවාඩු",
    "attendance.attendanceRate": "පැමිණීමේ අනුපාතය",
    "attendance.totalDays": "මුළු දින ගණන",
    "attendance.presentDays": "පැමිණි දින",
    "attendance.absentDays": "නොපැමිණි දින",
    "attendance.viewHistory": "ඉතිහාසය බලන්න",
    "attendance.date": "දිනය",
    "attendance.status": "තත්ත්වය",
    "attendance.reason": "හේතුව",
    
    // Announcements (Sinhala)
    "announcements.title": "නිවේදන",
    "announcements.subtitle": "නවතම යාවත්කාලීන සහ දැනුම්දීම්",
    "announcements.postedBy": "පළ කළේ",
    "announcements.postedOn": "පළ කළ දිනය",
    "announcements.readMore": "තව කියවන්න",
    "announcements.noAnnouncements": "නිවේදන නොමැත",
    
    // Report Cards (Sinhala)
    "reportCard.title": "දරුවන්ගේ ප්‍රගති වාර්තා",
    "reportCard.subtitle": "ඔබේ දරුවන්ගේ අධ්‍යයන ප්‍රගතිය නිරීක්ෂණය කරන්න",
    "reportCard.totalReports": "මුළු වාර්තා ගණන",
    "reportCard.filterByChild": "දරුවා අනුව පෙරීම:",
    "reportCard.allChildren": "සියලුම දරුවන්",
    "reportCard.noReportsYet": "තවමත් ප්‍රගති වාර්තා නැත",
    "reportCard.noReportsMessage": "ගුරුවරු විසින් ප්‍රගති වාර්තා ජනනය කළ පසු මෙහි පෙන්වනු ඇත.",
    "reportCard.clickToView": "විස්තර බැලීමට ඕනෑම ප්‍රගති වාර්තාවක් මත ක්ලික් කරන්න",
    "reportCard.viewDetails": "විස්තර බලන්න",
    "reportCard.loading": "ප්‍රගති වාර්තා පූරණය වෙමින්...",
    "reportCard.errorLoading": "ප්‍රගති වාර්තා පූරණය කිරීමේ දෝෂයකි",
    "reportCard.tryAgain": "නැවත උත්සාහ කරන්න",
    "reportCard.goBack": "ආපසු යන්න",
    
    // Report Card Details (Sinhala)
    "reportCard.header": "ප්‍රගති වාර්තාව",
    "reportCard.academicYear": "අධ්‍යයන වර්ෂය",
    "reportCard.name": "නම:",
    "reportCard.indexNo": "දර්ශක අංකය:",
    "reportCard.grade": "ශ්‍රේණිය:",
    "reportCard.examination": "විභාගය:",
    "reportCard.year": "වර්ෂය:",
    "reportCard.term": "කාර්තුව:",
    "reportCard.subject": "විෂයය",
    "reportCard.marks": "ලකුණු (%)",
    "reportCard.gradeColumn": "ශ්‍රේණිය",
    "reportCard.performanceSummary": "කාර්ය සාධන සාරාංශය",
    "reportCard.totalMarksObtained": "ලබාගත් මුළු ලකුණු:",
    "reportCard.averagePercentage": "සාමාන්‍ය ප්‍රතිශතය:",
    "reportCard.classPosition": "පන්ති ස්ථානය",
    "reportCard.classRank": "පන්ති තරාතිරම:",
    "reportCard.totalStudents": "මුළු සිසුන් සංඛ්‍යාව:",
    "reportCard.subjectsAverage": "විෂය සාමාන්‍යය:",
    "reportCard.notRankedYet": "තවම තරාතිරම් කර නැත",
    "reportCard.printButton": "🖨️ වාර්තාව මුද්‍රණය කරන්න",
    "reportCard.backButton": "← වාර්තා වෙත ආපසු",
    "reportCard.reportGenerated": "වාර්තාව ජනනය කළේ:",
    "reportCard.keepStriving": "විශිෂ්ටත්වය සඳහා උත්සාහ කරන්න!",
    
    // Common (Sinhala)
    "common.year": "වර්ෂය",
    "common.term": "කාර්තුව",
    "common.percentage": "ප්‍රතිශතය:",
    "common.rank": "තරාතිරම:",
    "common.marksObtained": "ලකුණු:",
    "common.search": "සොයන්න",
    "common.filter": "පෙරීම",
    "common.sort": "වර්ග කරන්න",
    "common.export": "අපනයනය",
    "common.print": "මුද්‍රණය",
    "common.save": "සුරකින්න",
    "common.cancel": "අවලංගු කරන්න",
    "common.confirm": "තහවුරු කරන්න",
    "common.delete": "මකන්න",
    "common.edit": "සංස්කරණය",
    "common.view": "බලන්න",
    "common.download": "බාගන්න",
    "common.upload": "උඩුගත කරන්න",
    "common.close": "වසන්න",
    "common.back": "ආපසු",
    "common.next": "ඊළඟ",
    "common.previous": "පෙර",
    "common.submit": "ඉදිරිපත් කරන්න",
    "common.loading": "පූරණය වෙමින්...",
    "common.success": "සාර්ථකයි",
    "common.error": "දෝෂයකි",
    "common.warning": "අවවාදයයි",
    "common.info": "තොරතුරු",
    "common.yes": "ඔව්",
    "common.no": "නැත",
    
    // Parent Dashboard (Sinhala)
    "parent.welcomeBack": "ආයුබෝවන්",
    "parent.dashboardSubtitle": "ඔබේ දරුවන්ගේ ප්‍රගතිය නිරීක්ෂණය කරන්න",
    "parent.myChildren": "මගේ දරුවන්",
    "parent.enrolledChildren": "ලියාපදිංචි දරුවන්",
    "parent.attendanceRate": "පැමිණීමේ අනුපාතය",
    "parent.last7Days": "අවසන් දින 7",
    "parent.upcomingExams": "ඉදිරි විභාග",
    "parent.thisMonth": "මෙම මාසය",
    "parent.messages": "පණිවිඩ",
    "parent.unreadMessages": "නොකියවූ පණිවිඩ",
    "parent.quickActions": "ඉක්මන් ක්‍රියාමාර්ග",
    "parent.childrenAttendance": "දරුවන්ගේ පැමිණීම",
    "parent.viewDetailedAttendance": "සවිස්තරාත්මක පැමිණීමේ වාර්තා බලන්න",
    "parent.academicResults": "අධ්‍යයන ප්‍රතිඵල",
    "parent.viewExamResults": "විභාග ප්‍රතිඵල සහ ශ්‍රේණි බලන්න",
    "parent.timetable": "කාලසටහන",
    "parent.checkClassSchedules": "පන්ති කාලසටහන් පරීක්ෂා කරන්න",
    "parent.assignments": "පැවරුම්",
    "parent.trackHomework": "ගෘහ පාඩම් සහ පැවරුම් නිරීක්ෂණය කරන්න",
    "parent.schoolEvents": "පාසල් සිදුවීම්",
    "parent.stayUpdated": "පාසල් සිදුවීම් සමඟ යාවත්කාලීනව සිටින්න",
    "parent.contactTeachers": "ගුරුවරුන් සම්බන්ධ කරගන්න",
    "parent.sendMessages": "ගුරුවරුන්ට පණිවිඩ යවන්න",
    "parent.recentAttendance": "මෑත පැමිණීම",
    "parent.last5Days": "අවසන් දින 5",
    "parent.viewDetails": "විස්තර බලන්න",
    "parent.fullProfile": "සම්පූර්ණ පැතිකඩ",
    "parent.noChildrenRegistered": "ලියාපදිංචි දරුවන් නොමැත",
    "parent.noRecentAttendance": "මෑත පැමිණීමේ වාර්තා නොමැත",
    "parent.notScheduled": "කාලසටහන් කර නැත",
    "parent.at": "පැය",
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Load language preference from localStorage
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "si")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
