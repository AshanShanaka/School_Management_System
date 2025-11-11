import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/messages - Get conversations for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Get messages for specific conversation
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: conversationId },
            { senderId: conversationId, receiverId: user.id }
          ]
        },
        orderBy: { createdAt: "asc" },
        take: 50 // Limit to last 50 messages
      });

      // Get user info for the conversation partner
      const partnerId = conversationId;
      let partnerInfo = null;

      // Try to find in each user type
      const teacher = await prisma.teacher.findUnique({
        where: { id: partnerId },
        select: { id: true, name: true, surname: true, email: true }
      });

      if (teacher) {
        partnerInfo = { ...teacher, role: "teacher" };
      } else {
        const student = await prisma.student.findUnique({
          where: { id: partnerId },
          select: { id: true, name: true, surname: true, username: true }
        });

        if (student) {
          partnerInfo = { ...student, role: "student" };
        } else {
          const parent = await prisma.parent.findUnique({
            where: { id: partnerId },
            select: { id: true, name: true, surname: true, email: true }
          });

          if (parent) {
            partnerInfo = { ...parent, role: "parent" };
          }
        }
      }

      return NextResponse.json({ 
        messages: messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          createdAt: msg.createdAt,
          isRead: msg.isRead,
          isSentByMe: msg.senderId === user.id
        })),
        partner: partnerInfo
      });
    } else {
      // Get all conversations for user
      const sentMessages = await prisma.message.findMany({
        where: { senderId: user.id },
        select: { receiverId: true, createdAt: true, content: true },
        orderBy: { createdAt: "desc" }
      });

      const receivedMessages = await prisma.message.findMany({
        where: { receiverId: user.id },
        select: { senderId: true, createdAt: true, content: true, isRead: true },
        orderBy: { createdAt: "desc" }
      });

      // Get unique conversation partners
      const partnerIds = new Set([
        ...sentMessages.map(m => m.receiverId),
        ...receivedMessages.map(m => m.senderId)
      ]);

      const conversations = [];

      for (const partnerId of Array.from(partnerIds)) {
        // Get last message between user and partner
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: user.id, receiverId: partnerId },
              { senderId: partnerId, receiverId: user.id }
            ]
          },
          orderBy: { createdAt: "desc" }
        });

        // Get unread count
        const unreadCount = await prisma.message.count({
          where: {
            senderId: partnerId,
            receiverId: user.id,
            isRead: false
          }
        });

        // Get partner info
        let partnerInfo = null;
        const teacher = await prisma.teacher.findUnique({
          where: { id: partnerId },
          select: { id: true, name: true, surname: true, email: true }
        });

        if (teacher) {
          partnerInfo = { ...teacher, role: "teacher" };
        } else {
          const student = await prisma.student.findUnique({
            where: { id: partnerId },
            select: { id: true, name: true, surname: true, username: true }
          });

          if (student) {
            partnerInfo = { ...student, role: "student" };
          } else {
            const parent = await prisma.parent.findUnique({
              where: { id: partnerId },
              select: { id: true, name: true, surname: true, email: true }
            });

            if (parent) {
              partnerInfo = { ...parent, role: "parent" };
            }
          }
        }

        if (partnerInfo && lastMessage) {
          conversations.push({
            partnerId,
            partner: partnerInfo,
            lastMessage: {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              isFromMe: lastMessage.senderId === user.id
            },
            unreadCount
          });
        }
      }

      // Sort by last message time
      conversations.sort((a, b) => 
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      );

      return NextResponse.json({ conversations });
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiverId, content } = await request.json();

    if (!receiverId || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Receiver ID and content are required" },
        { status: 400 }
      );
    }

    // Validate that receiver exists and user has permission to message them
    const canMessage = await validateMessagingPermission(user.id, user.role, receiverId);
    if (!canMessage) {
      return NextResponse.json(
        { error: "You don't have permission to message this user" },
        { status: 403 }
      );
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: user.id,
        receiverId
      }
    });

    return NextResponse.json({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      createdAt: message.createdAt,
      isRead: message.isRead
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// PATCH /api/messages - Mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { senderId } = await request.json();

    if (!senderId) {
      return NextResponse.json(
        { error: "Sender ID is required" },
        { status: 400 }
      );
    }

    // Mark all messages from senderId to current user as read
    await prisma.message.updateMany({
      where: {
        senderId,
        receiverId: user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}

// Helper function to validate messaging permissions
async function validateMessagingPermission(userId: string, userRole: string, receiverId: string): Promise<boolean> {
  // Get receiver's role
  let receiverRole = null;
  
  const teacher = await prisma.teacher.findUnique({ where: { id: receiverId } });
  if (teacher) receiverRole = "teacher";
  
  if (!receiverRole) {
    const student = await prisma.student.findUnique({ where: { id: receiverId } });
    if (student) receiverRole = "student";
  }
  
  if (!receiverRole) {
    const parent = await prisma.parent.findUnique({ where: { id: receiverId } });
    if (parent) receiverRole = "parent";
  }

  if (!receiverRole) return false;

  // Define messaging rules
  const messagingRules = {
    student: ["teacher"], // Students can message teachers
    parent: ["teacher"],  // Parents can message teachers
    teacher: ["student", "parent"], // Teachers can message students and parents
    admin: ["teacher", "student", "parent"] // Admin can message everyone
  };

  return messagingRules[userRole]?.includes(receiverRole) || false;
}
