import { NextResponse } from "next/server";

export type Faculty = { id: string; name: string };

export const FACULTIES: Faculty[] = [
  { id: "1", name: "Dr. Ramesh Sharma" },
  { id: "2", name: "Prof. Anita Gupta" },
  { id: "3", name: "Dr. Sunil Verma" },
];

export async function GET() {
  return NextResponse.json(FACULTIES);
}

export const dynamic = "force-dynamic";
