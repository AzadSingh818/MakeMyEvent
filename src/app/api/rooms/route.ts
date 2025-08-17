import { NextResponse } from "next/server";

export type Room = { id: string; name: string };

export const ROOMS: Room[] = [
  { id: "A101", name: "Auditorium 101" },
  { id: "B202", name: "Building B - Room 202" },
  { id: "C303", name: "Conference Room 303" },
];

export async function GET() {
  return NextResponse.json(ROOMS);
}

export const dynamic = "force-dynamic";
