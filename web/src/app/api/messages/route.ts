import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, desc } from "drizzle-orm";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/db";
import { messages, users } from "@/db/schema";

function auth(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try { return verifyToken(token); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const payload = auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tab = req.nextUrl.searchParams.get("tab") ?? "received";

  const sender   = db.select().from(users).as("sender");
  const receiver = db.select().from(users).as("receiver");

  if (tab === "sent") {
    const rows = await db
      .select({
        id:           messages.id,
        subject:      messages.subject,
        message:      messages.message,
        sentAt:       messages.sentAt,
        receiverId:   messages.receiverId,
        receiverName: receiver.username,
      })
      .from(messages)
      .leftJoin(receiver, eq(messages.receiverId, receiver.id))
      .where(eq(messages.senderId, payload.id))
      .orderBy(desc(messages.sentAt));

    return NextResponse.json(rows);
  }

  /* received — include seenAt so the UI can distinguish read/unread */
  const rows = await db
    .select({
      id:         messages.id,
      subject:    messages.subject,
      message:    messages.message,
      sentAt:     messages.sentAt,
      seenAt:     messages.seenAt,
      senderId:   messages.senderId,
      senderName: sender.username,
    })
    .from(messages)
    .leftJoin(sender, eq(messages.senderId, sender.id))
    .where(eq(messages.receiverId, payload.id))
    .orderBy(desc(messages.sentAt));

  return NextResponse.json(rows);
}

/* Count unseen messages — used by Navbar badge */
export async function HEAD(req: NextRequest) {
  const payload = auth(req);
  if (!payload) return new NextResponse(null, { status: 401 });

  const rows = await db
    .select({ id: messages.id })
    .from(messages)
    .where(and(eq(messages.receiverId, payload.id), isNull(messages.seenAt)));

  return new NextResponse(null, {
    status: 200,
    headers: { "X-Unseen-Count": String(rows.length) },
  });
}

export async function PATCH(req: NextRequest) {
  const payload = auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db
    .update(messages)
    .set({ seenAt: new Date() })
    .where(and(eq(messages.id, Number(id)), eq(messages.receiverId, payload.id)));

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const payload = auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

export async function DELETE(req: NextRequest) {
  const payload = auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db
    .delete(messages)
    .where(eq(messages.id, Number(id)));

  return NextResponse.json({ success: true });
}
