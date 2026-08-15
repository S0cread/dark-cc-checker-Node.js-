import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addTicket, getTickets, type Ticket, type TicketCategory } from "@/lib/db";
import { randomUUID } from "crypto";

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1480202405965729856/JkYbnt4wLBpkzweWT4J9X7X4rDJ1hL6TfB8ByQTcpYW4sQlaO7DR2rN10vIPqUt9J2hi";

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  genel: "Genel",
  odeme: "Ödeme",
  teknik: "Teknik",
  hesap: "Hesap",
  diger: "Diğer",
};

async function sendDiscordNotification(ticket: Ticket) {
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "🎫 Yeni Destek Talebi",
            color: 0x10b981,
            fields: [
              { name: "👤 Kullanıcı", value: `${ticket.userName} (${ticket.userEmail})`, inline: true },
              { name: "🏷️ Kategori", value: CATEGORY_LABELS[ticket.category], inline: true },
              { name: "📌 Konu", value: ticket.subject, inline: false },
              { name: "💬 Mesaj", value: ticket.message.slice(0, 1024), inline: false },
              { name: "🆔 Ticket ID", value: `\`${ticket.id}\``, inline: true },
              { name: "📅 Tarih", value: new Date(ticket.createdAt).toLocaleString("tr-TR"), inline: true },
            ],
            footer: { text: "darkcheck.co Destek Sistemi" },
            timestamp: ticket.createdAt,
          },
        ],
      }),
    });
  } catch (e) {
    console.error("Discord webhook error:", e);
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    const tickets = getTickets().filter((t) => t.userId === session.user!.id);
    return NextResponse.json(tickets);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

    const body = await req.json() as { category?: string; subject?: string; message?: string };
    const { category, subject, message } = body;

    if (!category || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Kategori, konu ve mesaj zorunludur." }, { status: 400 });
    }
    if (subject.trim().length < 5) {
      return NextResponse.json({ error: "Konu en az 5 karakter olmalı." }, { status: 400 });
    }
    if (message.trim().length < 20) {
      return NextResponse.json({ error: "Mesaj en az 20 karakter olmalı." }, { status: 400 });
    }

    const u = session.user as { id: string; name?: string | null; email?: string | null };
    const ticket: Ticket = {
      id: randomUUID(),
      userId: u.id,
      userName: u.name ?? "Bilinmiyor",
      userEmail: u.email ?? "",
      category: category as TicketCategory,
      subject: subject.trim(),
      message: message.trim(),
      status: "open",
      reply: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addTicket(ticket);
    await sendDiscordNotification(ticket);

    return NextResponse.json({ success: true, ticketId: ticket.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
