import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Simple test endpoint to verify exam models exist
export async function GET(request: NextRequest) {
  try {
    // Test if we can query the new models
    const examTypes = await prisma.examType.findMany();
    const exams = await prisma.exam.findMany();
    
    return NextResponse.json({
      success: true,
      examTypesCount: examTypes.length,
      examsCount: exams.length,
      models: {
        examType: "exists",
        exam: "exists"
      }
    });
  } catch (error) {
    console.error("Error testing exam models:", error);
    return NextResponse.json(
      { 
        error: "Failed to access exam models",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
