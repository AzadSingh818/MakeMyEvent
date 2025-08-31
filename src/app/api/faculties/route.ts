import { NextResponse } from "next/server";
import { getFaculties, type Faculty } from "@/lib/database/session-queries";

export async function GET() {
  try {
    const faculties = await getFaculties();
    return NextResponse.json(faculties);
  } catch (error) {
    console.error("Error fetching faculties:", error);
    return NextResponse.json(
      { error: "Failed to fetch faculties" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
