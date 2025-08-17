import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionById, updateSession } from "../../_store";

const BodySchema = z.object({
  id: z.string().min(1),
  inviteStatus: z.enum(["Accepted", "Declined"]),
  rejectionReason: z
    .enum(["NotInterested", "SuggestedTopic", "TimeConflict"])
    .optional(),
  suggestedTopic: z.string().optional(),
  suggestedTimeStart: z.string().optional(),
  suggestedTimeEnd: z.string().optional(),
  optionalQuery: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch((e: any) => {
      return NextResponse.json(
        { success: false, error: "Invalid JSON", details: e?.message || "" },
        { status: 400 }
      );
    });
    if (body instanceof NextResponse) return body;

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      id,
      inviteStatus,
      rejectionReason,
      suggestedTopic,
      suggestedTimeStart,
      suggestedTimeEnd,
      optionalQuery,
    } = parsed.data;

    const existing = await getSessionById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    const updates: any = { inviteStatus };
    if (inviteStatus === "Declined") {
      updates.rejectionReason = rejectionReason;
      updates.suggestedTopic = suggestedTopic || undefined;
      updates.suggestedTimeStart = suggestedTimeStart || undefined;
      updates.suggestedTimeEnd = suggestedTimeEnd || undefined;
      updates.optionalQuery = optionalQuery || undefined;
    } else {
      updates.rejectionReason = undefined;
      updates.suggestedTopic = undefined;
      updates.suggestedTimeStart = undefined;
      updates.suggestedTimeEnd = undefined;
      updates.optionalQuery = undefined;
    }

    await updateSession(id, updates);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: "Server error", details: e?.message || "" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
