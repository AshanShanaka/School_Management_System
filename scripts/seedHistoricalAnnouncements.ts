import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Historical Announcements for Grade 11 O/L students (past 3 months)
const HISTORICAL_ANNOUNCEMENTS = [
  // September 2025
  {
    title: "📚 New Academic Year - Grade 11 O/L Stream",
    description: "Welcome to Grade 11! This year is crucial for your O/L preparation. Subject selection deadline is September 15th. Choose subjects wisely based on your career goals and strengths.",
    date: new Date("2025-09-01T08:00:00"),
  },
  {
    title: "📖 O/L Textbooks Distribution",
    description: "Grade 11 O/L textbooks are now available at the bookstore. Collect your books with the distribution slip provided by your class teacher. Last date: September 10th.",
    date: new Date("2025-09-03T09:00:00"),
  },
  {
    title: "👔 School Uniform Policy Reminder",
    description: "All Grade 11 students must wear proper school uniform daily. Special relaxation only for after-school O/L classes. Sports uniform allowed only on designated days.",
    date: new Date("2025-09-05T08:30:00"),
  },
  {
    title: "🔬 Science Laboratory Safety Training",
    description: "Mandatory laboratory safety training for all science students. Sessions will be conducted by subject teachers during practical periods. Certificate required for O/L practicals.",
    date: new Date("2025-09-08T10:00:00"),
  },
  {
    title: "📅 First Term Examination - Grade 11",
    description: "First term examinations will be held from September 25-30. Syllabus coverage: first 3 months. Exam timetable posted on notice board. Prepare thoroughly as these marks count.",
    date: new Date("2025-09-12T08:00:00"),
  },
  {
    title: "💻 Computer Lab Access Schedule",
    description: "Grade 11 students can access computer lab for research and typing assignments. Monday to Friday 3:00-5:00 PM. Book your slot with the ICT teacher in advance.",
    date: new Date("2025-09-15T09:00:00"),
  },
  {
    title: "🏃 Sports Day Participation",
    description: "Annual sports day on September 28th. Grade 11 students encouraged to participate while balancing O/L studies. Registration with sports teacher by September 20th.",
    date: new Date("2025-09-18T08:00:00"),
  },
  {
    title: "📊 Mid-Term Progress Reports Available",
    description: "Mid-term progress reports ready for collection. Shows performance in all subjects with teacher comments. Parents should review and sign. Return to class teacher by September 30th.",
    date: new Date("2025-09-22T10:00:00"),
  },
  
  // October 2025
  {
    title: "🎃 School Closed - Poya Day",
    description: "School will be closed on October 6th (Full Moon Poya Day). Use this day effectively for O/L revision. School reopens October 7th with regular schedule.",
    date: new Date("2025-10-04T08:00:00"),
  },
  {
    title: "📝 Term 2 Begins - October Schedule",
    description: "Term 2 commenced. Increased focus on O/L preparation. Additional classes every Saturday. Attendance mandatory unless valid medical certificate provided.",
    date: new Date("2025-10-07T08:30:00"),
  },
  {
    title: "🔍 Career Guidance Session - O/L Subject Selection",
    description: "Career counselor will discuss A/L subject streams based on O/L subject choices. Grade 11 students can book individual appointments. Office hours: Mon-Fri 2-4 PM.",
    date: new Date("2025-10-10T09:00:00"),
  },
  {
    title: "📚 Library New Arrivals - O/L Reference Books",
    description: "Latest O/L reference books and past paper solution guides now available. Priority lending for Grade 11 students. Borrowing period extended to 2 weeks for reference materials.",
    date: new Date("2025-10-14T08:00:00"),
  },
  {
    title: "🎓 Former Student Mentorship Program",
    description: "Successfully completed O/L students from last year volunteering to mentor Grade 11 students. Sign up with your class teacher. One-on-one and group sessions available.",
    date: new Date("2025-10-18T10:00:00"),
  },
  {
    title: "⚠️ Punctuality Notice",
    description: "Repeated late arrivals will affect conduct grades. School starts at 7:30 AM sharp. Grade 11 students arriving late miss important revision sessions. Parents will be informed.",
    date: new Date("2025-10-21T08:00:00"),
  },
  {
    title: "🌟 Student of the Month - October",
    description: "Congratulations to outstanding Grade 11 students who showed excellence in studies and conduct. Names displayed on notice board. Keep up the excellent work!",
    date: new Date("2025-10-25T09:00:00"),
  },
  {
    title: "📱 Digital Learning Resources",
    description: "School website updated with O/L e-learning materials. Video lessons, MCQ practice, and interactive quizzes available. Login credentials provided via class teacher.",
    date: new Date("2025-10-28T08:30:00"),
  },
  
  // November 2025
  {
    title: "📖 November Study Plan Released",
    description: "Comprehensive study plan for November covering all O/L subjects released. Daily targets and weekly goals specified. Follow diligently for optimal preparation.",
    date: new Date("2025-11-01T08:00:00"),
  },
  {
    title: "🧪 Chemistry Practical Exam - Grade 11",
    description: "Chemistry practical examination scheduled for November 8-10. Lab coat, safety goggles mandatory. Review practical manual and experiment procedures thoroughly.",
    date: new Date("2025-11-04T09:00:00"),
  },
  {
    title: "💰 School Fees Payment Reminder",
    description: "Term 3 school fees payment deadline: November 15th. Pay at the office during working hours. Receipts must be submitted to class teacher for record purposes.",
    date: new Date("2025-11-06T08:30:00"),
  },
  {
    title: "🏆 Mathematics Olympiad - Grade 11",
    description: "School-level Mathematics Olympiad on November 18th. Great opportunity to enhance problem-solving skills for O/L. Register at Math department by November 12th.",
    date: new Date("2025-11-08T10:00:00"),
  },
  {
    title: "📋 Class Photo Day",
    description: "Official class photographs on November 12th. Wear proper school uniform. These photos will be used for O/L exam registration and school leaving certificates.",
    date: new Date("2025-11-10T08:00:00"),
  },
  {
    title: "🎯 Weak Areas Identification Program",
    description: "Teachers conducting individual consultations to identify weak areas in O/L preparation. Schedule appointment with subject teachers. Extra support classes will be arranged.",
    date: new Date("2025-11-13T09:00:00"),
  },
  {
    title: "🔊 English Speaking Competition",
    description: "English Department organizing public speaking competition for Grade 11. Excellent practice for O/L oral examination. Participation certificates provided. Register by November 20th.",
    date: new Date("2025-11-15T08:30:00"),
  },
  {
    title: "📊 Term 2 Results Published",
    description: "Term 2 examination results now available. Collect report cards from class teacher. Analyze performance trends. Parents' signature required. Results discussion on November 30th.",
    date: new Date("2025-11-18T10:00:00"),
  },
  {
    title: "🎄 Year-End School Events Schedule",
    description: "December event calendar released. Prize giving, carol service, and final term activities. Grade 11 students expected to participate while maintaining O/L focus.",
    date: new Date("2025-11-20T08:00:00"),
  },
];

async function main() {
  console.log("📜 Starting Historical Announcements Seeding...\n");

  try {
    // Get all Grade 11 classes
    const grade11Classes = await prisma.class.findMany({
      where: {
        grade: {
          level: 11,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (grade11Classes.length === 0) {
      console.log("❌ No Grade 11 classes found!");
      return;
    }

    const classIds = grade11Classes.map((c) => c.id);
    console.log(`📚 Found ${grade11Classes.length} Grade 11 classes: ${grade11Classes.map((c) => c.name).join(", ")}\n`);

    let announcementsCreated = 0;
    const monthGroups = {
      September: 0,
      October: 0,
      November: 0,
    };

    // Create Historical Announcements
    console.log("📢 Creating Historical Announcements...\n");
    
    for (const announcementData of HISTORICAL_ANNOUNCEMENTS) {
      const month = announcementData.date.toLocaleString('default', { month: 'long' });
      
      // Create announcement for each Grade 11 class
      for (const classId of classIds) {
        await prisma.announcement.create({
          data: {
            title: announcementData.title,
            description: announcementData.description,
            date: announcementData.date,
            classId: classId,
          },
        });
        announcementsCreated++;
      }
      
      if (month in monthGroups) {
        monthGroups[month as keyof typeof monthGroups]++;
      }
      
      console.log(`   ✅ ${announcementData.date.toLocaleDateString()}: ${announcementData.title}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ Historical Announcements Seeding Complete!");
    console.log("=".repeat(70));
    console.log(`📊 Summary:`);
    console.log(`   📢 Total Announcements Created: ${announcementsCreated}`);
    console.log(`   🎯 Target Classes: ${grade11Classes.map((c) => c.name).join(", ")}`);
    console.log(`   📅 Time Period: September - November 2025`);
    console.log("=".repeat(70) + "\n");

    console.log("📅 Monthly Distribution:");
    console.log(`   📌 September 2025: ${monthGroups.September} announcements`);
    console.log(`   📌 October 2025: ${monthGroups.October} announcements`);
    console.log(`   📌 November 2025: ${monthGroups.November} announcements\n`);

    console.log("📋 Announcement Categories:");
    console.log("   • Academic (Exams, Results, Study Plans)");
    console.log("   • Resources (Library, Digital Materials)");
    console.log("   • Events (Sports, Competitions, Ceremonies)");
    console.log("   • Administrative (Fees, Uniform, Punctuality)");
    console.log("   • Support (Mentorship, Counseling, Guidance)");
    console.log("   • Extracurricular (Olympiad, Speaking Competition)\n");

    console.log("💡 Historical context added for realistic school environment!");

  } catch (error) {
    console.error("\n❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
