import bcrypt from "bcrypt";
import { NextRequest } from "next/server";
import prisma from "./prisma";

export interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  surname: string;
  role: "admin" | "teacher" | "student" | "parent";
  phone?: string;
  address?: string;
  birthday?: Date | string;
  sex?: "MALE" | "FEMALE";
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create simple JWT-like token
export function createToken(user: User): string {
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "HS256" }));
  const payload = btoa(
    JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      surname: user.surname,
      role: user.role,
      phone: user.phone,
      address: user.address,
      birthday: user.birthday,
      sex: user.sex,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    })
  );
  const signature = btoa(`${header}.${payload}.signature`);

  return `${header}.${payload}.${signature}`;
}

// Verify and decode token
export function verifyToken(token: string): User | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Date.now()) return null;

    return {
      id: payload.id,
      username: payload.username,
      email: payload.email,
      name: payload.name,
      surname: payload.surname,
      role: payload.role,
      phone: payload.phone,
      address: payload.address,
      birthday: payload.birthday,
      sex: payload.sex,
    };
  } catch (error) {
    return null;
  }
}

// Get user by credentials
export async function getUserByCredentials(
  identifier: string,
  password: string
): Promise<AuthResult> {
  try {
    // Try to find user in database tables first
    let user: any = null;
    let role: "admin" | "teacher" | "student" | "parent" | null = null;

    try {
      // Check admin first
      if (identifier.includes("@")) {
        const admin = await prisma.admin.findFirst({
          where: { email: identifier },
        });
        if (admin) {
          user = admin;
          role = "admin";
        }
      } else {
        const admin = await prisma.admin.findFirst({
          where: { username: identifier },
        });
        if (admin) {
          user = admin;
          role = "admin";
        }
      }

      // Check teacher if not found in admin
      if (!user) {
        if (identifier.includes("@")) {
          const teacher = await prisma.teacher.findFirst({
            where: { email: identifier },
          });
          if (teacher) {
            user = teacher;
            role = "teacher";
          }
        } else {
          const teacher = await prisma.teacher.findFirst({
            where: { username: identifier },
          });
          if (teacher) {
            user = teacher;
            role = "teacher";
          }
        }
      }

      // Check student if not found in teacher
      if (!user) {
        if (identifier.includes("@")) {
          const student = await prisma.student.findFirst({
            where: { email: identifier },
          });
          if (student) {
            user = student;
            role = "student";
          }
        } else {
          const student = await prisma.student.findFirst({
            where: { username: identifier },
          });
          if (student) {
            user = student;
            role = "student";
          }
        }
      }

      // Check parent if not found in student
      if (!user) {
        if (identifier.includes("@")) {
          const parent = await prisma.parent.findFirst({
            where: { email: identifier },
          });
          if (parent) {
            user = parent;
            role = "parent";
          }
        } else {
          const parent = await prisma.parent.findFirst({
            where: { username: identifier },
          });
          if (parent) {
            user = parent;
            role = "parent";
          }
        }
      }

      // If found in database, verify password
      if (user && user.password && role) {
        const isValidPassword = await verifyPassword(password, user.password);
        if (isValidPassword) {
          return {
            success: true,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              name: user.name,
              surname: user.surname,
              role: role,
              phone: user.phone || undefined,
              address: user.address || undefined,
              birthday: user.birthday || undefined,
              sex: user.sex || undefined,
            },
          };
        } else {
          return { success: false, error: "Invalid password" };
        }
      }
    } catch (dbError) {
      console.log("Database lookup failed, trying hardcoded users...", dbError);
    }

    // Fallback to hardcoded users if database lookup fails
    // Check admin first - temporary hardcoded admin
    if (identifier === "admin" && password === "admin123") {
      return {
        success: true,
        user: {
          id: "admin-temp-id",
          username: "admin",
          email: "admin@school.com",
          name: "Admin",
          surname: "User",
          role: "admin",
        },
      };
    }

    // Check teacher - temporary hardcoded teacher
    if (
      (identifier === "kasun" || identifier === "kasun@gmail.com") &&
      password === "Teach@1003"
    ) {
      return {
        success: true,
        user: {
          id: "teacher-temp-id",
          username: "kasun",
          email: "kasun@gmail.com",
          name: "Kasun",
          surname: "Perera",
          role: "teacher",
        },
      };
    }

    // Additional hardcoded teacher for testing
    if (identifier === "teacher1" && password === "teacher123") {
      return {
        success: true,
        user: {
          id: "teacher-temp-id-2",
          username: "teacher1",
          email: "teacher1@example.com",
          name: "John",
          surname: "Teacher",
          role: "teacher",
        },
      };
    }

    // Check student - temporary hardcoded student
    if (identifier === "student1" && password === "student123") {
      return {
        success: true,
        user: {
          id: "student-temp-id",
          username: "student1",
          email: "student@example.com",
          name: "Jane",
          surname: "Doe",
          role: "student",
        },
      };
    }

    // Check parent - temporary hardcoded parent
    if (identifier === "parent1" && password === "parent123") {
      return {
        success: true,
        user: {
          id: "parent-temp-id",
          username: "parent1",
          email: "parent@example.com",
          name: "John",
          surname: "Doe",
          role: "parent",
        },
      };
    }

    return { success: false, error: "Invalid credentials" };
  } catch (error) {
    console.error("Authentication error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

// Get current user from request
export async function getCurrentUser(
  request?: NextRequest
): Promise<User | null> {
  try {
    let token: string | undefined;

    if (request) {
      // For API routes - get token from request cookies
      token = request.cookies.get("auth-token")?.value;
    } else {
      // For server components - dynamic import to avoid build issues
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = cookies();
        token = cookieStore.get("auth-token")?.value;
      } catch (error) {
        // If cookies import fails (e.g., in API routes), return null
        console.warn("Could not access cookies in this context");
        return null;
      }
    }

    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

// Login function
export async function login(
  identifier: string,
  password: string
): Promise<AuthResult & { token?: string }> {
  const authResult = await getUserByCredentials(identifier, password);

  if (!authResult.success || !authResult.user) {
    return authResult;
  }

  // Create token
  const token = createToken(authResult.user);

  return {
    ...authResult,
    token,
  };
}

// Require authentication (for API routes)
export async function requireAuth(
  request: NextRequest,
  allowedRoles?: string[]
): Promise<{ user: User | null; error?: string }> {
  const user = await getCurrentUser(request);

  if (!user) {
    return { user: null, error: "Authentication required" };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { user: null, error: "Insufficient permissions" };
  }

  return { user };
}
