import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateItem = {
  title: string;
  facultyId: string;
  email: string;
  place: string;
  roomId: string;
  description: string;
  time: string; // ISO
  status?: "Draft" | "Confirmed";
  inviteStatus?: "Pending" | "Accepted" | "Declined";
  travelStatus?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 }
      );

    const items: CreateItem[] = Array.isArray(body) ? body : [body];

    const invalid = items.find(
      (it) =>
        !it ||
        !it.title ||
        !it.facultyId ||
        !it.email ||
        !it.place ||
        !it.roomId ||
        !it.description ||
        !it.time
    );
    if (invalid) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const facultyIds = Array.from(new Set(items.map((i) => i.facultyId)));
    const faculties = await prisma.faculty.findMany({
      where: { id: { in: facultyIds } },
      select: { id: true },
    });
    if (faculties.length !== facultyIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more facultyId not found" },
        { status: 400 }
      );
    }

    const roomIds = Array.from(new Set(items.map((i) => i.roomId)));
    const rooms = await prisma.room.findMany({
      where: { id: { in: roomIds } },
      select: { id: true },
    });
    if (rooms.length !== roomIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more roomId not found" },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(
      items.map((it) =>
        prisma.facultySession.create({
          data: {
            title: it.title,
            facultyId: it.facultyId,
            email: it.email.toLowerCase(),
            place: it.place,
            roomId: it.roomId,
            description: it.description,
            time: new Date(it.time),
            status: it.status === "Confirmed" ? "Confirmed" : "Draft",
            inviteStatus: it.inviteStatus ?? "Pending",
            travelStatus: it.travelStatus ?? "Pending",
          },
          include: { room: true, faculty: true },
        })
      )
    );

    return NextResponse.json(
      { success: true, count: created.length, data: created },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
