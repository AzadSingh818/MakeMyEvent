import { NextResponse } from "next/server";
import { getRooms, type Room } from "@/lib/database/session-queries";

export async function GET() {
  try {
    const rooms = await getRooms();
    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";