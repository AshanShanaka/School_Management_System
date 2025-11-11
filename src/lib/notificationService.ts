import prisma from "@/lib/prisma";

interface CreateNotificationInput {
  title: string;
  message: string;
  type: "event" | "announcement" | "system";
  relatedId?: string;
  relatedType?: "event" | "announcement";
  classId?: number;
}

export class NotificationService {
  // Create notifications for all relevant users when an event/announcement is created
  static async createNotificationsForItem(input: CreateNotificationInput) {
    try {
      const { title, message, type, relatedId, relatedType, classId } = input;

      // Get all users who should receive this notification
      const targetUsers = await this.getTargetUsers(classId);

      // Create notifications for each target user
      const notifications = [];
      
      for (const user of targetUsers) {
        notifications.push({
          title,
          message,
          type,
          userId: user.id,
          userRole: user.role,
          relatedId,
          relatedType,
          classId: classId || null,
        });
      }

      // Bulk create notifications
      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
        
        console.log(`Created ${notifications.length} notifications for ${type}: ${title}`);
      }

      return notifications.length;
    } catch (error) {
      console.error("Error creating notifications:", error);
      throw error;
    }
  }

  // Get target users based on class and role
  private static async getTargetUsers(classId?: number) {
    const users: Array<{ id: string; role: string }> = [];

    if (classId) {
      // Get users for specific class
      const classData = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          students: {
            select: { id: true, parentId: true },
          },
          lessons: {
            select: { teacherId: true },
            distinct: ["teacherId"],
          },
        },
      });

      if (classData) {
        // Add students
        classData.students.forEach(student => {
          users.push({ id: student.id, role: "student" });
          // Add their parents
          users.push({ id: student.parentId, role: "parent" });
        });

        // Add teachers
        classData.lessons.forEach(lesson => {
          users.push({ id: lesson.teacherId, role: "teacher" });
        });
      }
    } else {
      // Get all users for school-wide announcements
      const [students, teachers, parents] = await Promise.all([
        prisma.student.findMany({ select: { id: true } }),
        prisma.teacher.findMany({ select: { id: true } }),
        prisma.parent.findMany({ select: { id: true } }),
      ]);

      students.forEach(student => users.push({ id: student.id, role: "student" }));
      teachers.forEach(teacher => users.push({ id: teacher.id, role: "teacher" }));
      parents.forEach(parent => users.push({ id: parent.id, role: "parent" }));
    }

    // Remove duplicates
    const uniqueUsers = users.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id && u.role === user.role)
    );

    return uniqueUsers;
  }

  // Mark notifications as read
  static async markAsRead(notificationIds: string[]) {
    try {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      throw error;
    }
  }

  // Get notifications for a user
  static async getUserNotifications(userId: string, limit: number = 10) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      return notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        description: notification.message,
        date: notification.createdAt,
        class: notification.classId ? `Class ${notification.classId}` : "All Classes",
        isRead: notification.isRead,
      }));
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      throw error;
    }
  }

  // Create notification for event
  static async createEventNotification(event: any) {
    const message = `New event scheduled for ${new Date(event.startTime).toLocaleDateString()}`;
    
    return await this.createNotificationsForItem({
      title: event.title,
      message,
      type: "event",
      relatedId: event.id.toString(),
      relatedType: "event",
      classId: event.classId,
    });
  }

  // Create notification for announcement
  static async createAnnouncementNotification(announcement: any) {
    const message = announcement.description.length > 100 
      ? announcement.description.substring(0, 100) + "..."
      : announcement.description;
    
    return await this.createNotificationsForItem({
      title: announcement.title,
      message,
      type: "announcement",
      relatedId: announcement.id.toString(),
      relatedType: "announcement",
      classId: announcement.classId,
    });
  }
}
