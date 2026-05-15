import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { messages } from "@/db/schema";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { receiverId, subject, message } = body;

  if (!receiverId || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [saved] = await db
    .insert(messages)
    .values({
      senderId:   payload.id,
      receiverId: Number(receiverId),
      subject:    subject.trim(),
      message:    message.trim(),
    })
    .returning();

  return NextResponse.json({ success: true, id: saved.id });
}
