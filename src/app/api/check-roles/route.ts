import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Check for the specific users
    const specificUsers = await prisma.user.findMany({
      where: {
        OR: [
          { username: 'ravi.perera@wkcc.lk' },
          { username: 'kamala.senanayake@wkcc.lk' },
        ]
      },
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        role: true
      }
    });

    // Get sample of all users
    const allUsers = await prisma.user.findMany({
      select: {
        username: true,
        name: true,
        surname: true,
        role: true
      },
      take: 50,
      orderBy: {
        username: 'asc'
      }
    });

    // Get count by role
    const teachers = await prisma.user.count({ where: { role: 'teacher' } });
    const students = await prisma.user.count({ where: { role: 'student' } });
    const parents = await prisma.user.count({ where: { role: 'parent' } });
    const admins = await prisma.user.count({ where: { role: 'admin' } });

    return NextResponse.json({
      specificUsers,
      allUsers,
      counts: {
        teachers,
        students,
        parents,
        admins,
        total: teachers + students + parents + admins
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
