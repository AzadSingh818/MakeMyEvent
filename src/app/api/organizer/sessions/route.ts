import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get("eventId") || undefined;
    const createdBy = req.nextUrl.searchParams.get("createdBy") || undefined;
    const startFrom = req.nextUrl.searchParams.get("startFrom") || undefined; // ISO
    const startTo = req.nextUrl.searchParams.get("startTo") || undefined; // ISO

    const sessions = await prisma.conference_sessions.findMany({
      where: {
        ...(eventId ? { event_id: eventId } : {}),
        ...(createdBy ? { created_by: createdBy } : {}),
        ...(startFrom || startTo
          ? {
              start_time: {
                ...(startFrom ? { gte: new Date(startFrom) } : {}),
                ...(startTo ? { lte: new Date(startTo) } : {}),
              },
            }
          : {}),
      },
      include: { halls: true, events: true },
      orderBy: [{ start_time: "asc" }],
    });

    return NextResponse.json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
