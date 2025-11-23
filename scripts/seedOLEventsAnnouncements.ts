import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Events for Grade 11 O/L students
const EVENTS = [
  {
    title: "O/L Mock Examination - Mathematics",
    description: "First mock examination for GCE O/L Mathematics. This exam will help you prepare for the actual O/L exam pattern. Duration: 3 hours. Syllabus: Full Grade 11 Mathematics curriculum covered so far.",
    startDate: new Date("2025-12-15T08:00:00"),
    endDate: new Date("2025-12-15T11:00:00"),
    classIds: [] as number[], // Will be populated with Grade 11 classes
  },
  {
    title: "O/L Mock Examination - Science",
    description: "Mock examination covering Physics, Chemistry, and Biology. This comprehensive exam follows the O/L format with MCQs and structured questions. Bring your calculator and required materials.",
    startDate: new Date("2025-12-16T08:00:00"),
    endDate: new Date("2025-12-16T11:00:00"),
    classIds: [],
  },
  {
    title: "O/L Mock Examination - English",
    description: "English Language paper including comprehension, grammar, composition, and essay writing. Duration: 3 hours. This mock follows the official O/L English paper format.",
    startDate: new Date("2025-12-17T08:00:00"),
    endDate: new Date("2025-12-17T11:00:00"),
    classIds: [],
  },
  {
    title: "O/L Revision Workshop - Mathematics",
    description: "Intensive revision session focusing on commonly asked O/L Mathematics questions. Topics: Algebra, Geometry, Trigonometry, and Statistics. Bring past papers and textbooks.",
    startDate: new Date("2025-12-02T13:00:00"),
    endDate: new Date("2025-12-02T16:00:00"),
    classIds: [],
  },
  {
    title: "O/L Revision Workshop - Science Practicals",
    description: "Hands-on revision of O/L Science practical experiments. Focus on proper technique, observations, and report writing. Required for practical examination preparation.",
    startDate: new Date("2025-12-05T13:00:00"),
    endDate: new Date("2025-12-05T16:00:00"),
    classIds: [],
  },
  {
    title: "O/L Past Papers Discussion - All Subjects",
    description: "Interactive session discussing solutions to past 5 years O/L examination papers. Teachers will explain marking schemes and common mistakes. Bring your attempted papers.",
    startDate: new Date("2025-12-09T09:00:00"),
    endDate: new Date("2025-12-09T15:00:00"),
    classIds: [],
  },
  {
    title: "GCE O/L Examination Guidelines Meeting",
    description: "Important meeting covering O/L exam rules, required materials, timetable, and examination center details. Attendance is mandatory for all Grade 11 students.",
    startDate: new Date("2025-11-28T14:00:00"),
    endDate: new Date("2025-11-28T16:00:00"),
    classIds: [],
  },
  {
    title: "O/L Study Skills Workshop",
    description: "Learn effective study techniques, time management, exam strategies, and stress management. Expert guidance on how to maximize your O/L preparation in the remaining time.",
    startDate: new Date("2025-12-03T10:00:00"),
    endDate: new Date("2025-12-03T12:00:00"),
    classIds: [],
  },
  {
    title: "Parent-Teacher Meeting - O/L Progress Review",
    description: "Discussion on student O/L preparation progress, strengths, areas for improvement, and home support strategies. Parents and students should attend together.",
    startDate: new Date("2025-11-30T09:00:00"),
    endDate: new Date("2025-11-30T13:00:00"),
    classIds: [],
  },
  {
    title: "O/L Chemistry Practical Revision",
    description: "Focused revision on O/L Chemistry practical experiments including qualitative analysis, titrations, and gas preparations. Lab safety and proper technique emphasis.",
    startDate: new Date("2025-12-10T13:00:00"),
    endDate: new Date("2025-12-10T15:00:00"),
    classIds: [],
  },
];

// Announcements for Grade 11 O/L students
const ANNOUNCEMENTS = [
  {
    title: "📢 GCE O/L 2026 Examination Registration",
    description: "All Grade 11 students must complete O/L examination registration by December 1st, 2025. Required documents: Birth certificate copy, 2 passport photos, and registration fee receipt. Contact the office for forms.",
    date: new Date("2025-11-22T08:00:00"),
    classIds: [],
  },
  {
    title: "📚 O/L Past Papers Available at Library",
    description: "Past O/L examination papers (2015-2025) for all subjects are now available at the school library. Students can photocopy or reference them during library hours. First come, first served.",
    date: new Date("2025-11-23T09:00:00"),
    classIds: [],
  },
  {
    title: "⏰ Extended Library Hours for O/L Students",
    description: "Starting next week, the library will remain open until 6:00 PM on weekdays and 2:00 PM on Saturdays exclusively for Grade 11 students preparing for O/L exams.",
    date: new Date("2025-11-25T08:30:00"),
    classIds: [],
  },
  {
    title: "📝 O/L Mock Examination Schedule Released",
    description: "The complete O/L mock examination schedule has been posted on the notice board. Mock exams will be held from December 15-20. Students must attend all papers. Hall tickets will be distributed next week.",
    date: new Date("2025-11-24T10:00:00"),
    classIds: [],
  },
  {
    title: "🎯 Free O/L Coaching Classes - Mathematics & Science",
    description: "Additional coaching classes for Mathematics and Science will be conducted every Saturday from 8:00 AM to 12:00 PM. No additional fees. Registration at the office by November 29th.",
    date: new Date("2025-11-26T08:00:00"),
    classIds: [],
  },
  {
    title: "📖 Recommended Study Materials for O/L",
    description: "A list of recommended textbooks, revision guides, and online resources for O/L preparation has been uploaded to the school website. Subject teachers have verified all materials.",
    date: new Date("2025-11-27T09:00:00"),
    classIds: [],
  },
  {
    title: "💡 O/L Motivation and Counseling Sessions",
    description: "Free counseling sessions are available for O/L students experiencing exam stress or anxiety. Contact the school counselor to book appointments. Confidential and supportive environment.",
    date: new Date("2025-11-29T10:00:00"),
    classIds: [],
  },
  {
    title: "🔬 Science Laboratory Open for Practice",
    description: "Science laboratories will be open for Grade 11 students to practice O/L practical experiments under teacher supervision. Monday to Friday, 3:00 PM - 5:00 PM. Prior booking required.",
    date: new Date("2025-11-28T08:00:00"),
    classIds: [],
  },
  {
    title: "📋 O/L Syllabus Coverage Completion Notice",
    description: "All Grade 11 teachers have completed syllabus coverage for their respective subjects. Revision phase begins next week. Students should focus on practicing past papers and identifying weak areas.",
    date: new Date("2025-12-01T08:30:00"),
    classIds: [],
  },
  {
    title: "🏆 Excellence Awards for Top O/L Performers",
    description: "Students achieving 8 or 9 A's in the O/L examination will receive academic excellence awards and scholarships for A/L studies. Previous year awardees will share their experiences next Friday.",
    date: new Date("2025-11-30T09:00:00"),
    classIds: [],
  },
  {
    title: "📱 WhatsApp Study Groups Created",
    description: "Official WhatsApp groups have been created for each subject for doubt clarification and resource sharing. Group links are available with your class teachers. Academic content only - strictly monitored.",
    date: new Date("2025-11-23T14:00:00"),
    classIds: [],
  },
  {
    title: "⚠️ Important: O/L Exam Hall Conduct Rules",
    description: "Students must familiarize themselves with O/L examination hall rules posted on the notice board. Violations can lead to paper cancellation. Mobile phones, smartwatches strictly prohibited in exam halls.",
    date: new Date("2025-12-02T08:00:00"),
    classIds: [],
  },
  {
    title: "🍎 Healthy Diet Tips for O/L Students",
    description: "School nutritionist has prepared guidelines for healthy eating during exam preparation period. Proper nutrition improves concentration and memory. Guidelines available at the notice board.",
    date: new Date("2025-11-26T10:00:00"),
    classIds: [],
  },
  {
    title: "📊 O/L Performance Analysis Available",
    description: "Individual O/L preparation progress reports are ready. Students can collect reports from class teachers. Reports include strengths, weaknesses, and personalized study recommendations.",
    date: new Date("2025-12-04T09:00:00"),
    classIds: [],
  },
  {
    title: "🎓 O/L Success Stories Session",
    description: "Past students who achieved outstanding O/L results will share their study strategies and time management tips. Session scheduled for December 6th at 2:00 PM in the main hall.",
    date: new Date("2025-12-03T08:00:00"),
    classIds: [],
  },
];

async function main() {
  console.log("🎓 Starting O/L Events and Announcements Seeding...\n");

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

    // Create Events using batch insert
    console.log("📅 Creating O/L Events (batch mode)...\n");
    const eventsToCreate = EVENTS.flatMap((eventData) =>
      classIds.map((classId) => ({
        title: eventData.title,
        description: eventData.description,
        startTime: eventData.startDate,
        endTime: eventData.endDate,
        classId: classId,
      }))
    );

    const createdEvents = await prisma.event.createMany({
      data: eventsToCreate,
      skipDuplicates: true,
    });

    console.log(`   ✅ Created ${createdEvents.count} events for ${grade11Classes.length} classes`);

    console.log("\n" + "=".repeat(70));

    // Create Announcements using batch insert
    console.log("\n📢 Creating O/L Announcements (batch mode)...\n");
    const announcementsToCreate = ANNOUNCEMENTS.flatMap((announcementData) =>
      classIds.map((classId) => ({
        title: announcementData.title,
        description: announcementData.description,
        date: announcementData.date,
        classId: classId,
      }))
    );

    const createdAnnouncements = await prisma.announcement.createMany({
      data: announcementsToCreate,
      skipDuplicates: true,
    });

    console.log(`   ✅ Created ${createdAnnouncements.count} announcements for ${grade11Classes.length} classes`);

    const eventsCreated = createdEvents.count;
    const announcementsCreated = createdAnnouncements.count;

    console.log("\n" + "=".repeat(70));
    console.log("✅ O/L Events and Announcements Seeding Complete!");
    console.log("=".repeat(70));
    console.log(`📊 Summary:`);
    console.log(`   📅 Events Created: ${eventsCreated}`);
    console.log(`   📢 Announcements Created: ${announcementsCreated}`);
    console.log(`   🎯 Target Classes: ${grade11Classes.map((c) => c.name).join(", ")}`);
    console.log("=".repeat(70) + "\n");

    console.log("📋 Event Categories Created:");
    console.log("   • Mock Examinations (3)");
    console.log("   • Revision Workshops (3)");
    console.log("   • Parent-Teacher Meetings (1)");
    console.log("   • Study Skills & Guidance (2)");
    console.log("   • Practical Sessions (1)\n");

    console.log("📋 Announcement Categories Created:");
    console.log("   • Exam Registration & Procedures (3)");
    console.log("   • Study Resources & Materials (4)");
    console.log("   • Support Services (3)");
    console.log("   • Motivational & Success Stories (2)");
    console.log("   • Additional Classes & Facilities (3)\n");

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
