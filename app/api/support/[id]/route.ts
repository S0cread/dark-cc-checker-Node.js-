import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTickets, updateTicket } from "@/lib/db";

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1480202405965729856/JkYbnt4wLBpkzweWT4J9X7X4rDJ1hL6TfB8ByQTcpYW4sQlaO7DR2rN10vIPqUt9J2hi";

async function notifyReply(ticketId: string, subject: string, reply: string) {
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "✅ Ticket Yanıtlandı",
          color: 0x6366f1,
          fields: [
            { name: "🆔 Ticket ID", value: `\`${ticketId}\``, inline: true },
            { name: "📌 Konu", value: subject, inline: true },
            { name: "💬 Yanıt", value: reply.slice(0, 1024), inline: false },
          ],
          footer: { text: "darkcheck.co Destek Sistemi" },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch (e) {
    console.error("Discord webhook error:", e);
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const role = (session?.user as Record<string, unknown>)?.role as string | undefined;
    if (role !== "super_admin" && role !== "mini_admin") {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }
    const { id } = await params;
    const ticket = getTickets().find((t) => t.id === id);
    if (!ticket) return NextResponse.json({ error: "Ticket bulunamadı." }, { status: 404 });
    return NextResponse.json(ticket);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const role = (session?.user as Record<string, unknown>)?.role as string | undefined;
    if (role !== "super_admin" && role !== "mini_admin") {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json() as { status?: string; reply?: string };
    const ticket = getTickets().find((t) => t.id === id);
    if (!ticket) return NextResponse.json({ error: "Ticket bulunamadı." }, { status: 404 });

    const updated = updateTicket(id, {
      status: (body.status as "open" | "in_progress" | "closed") ?? ticket.status,
      reply: body.reply ?? ticket.reply,
    });

    if (body.reply && body.reply !== ticket.reply) {
      await notifyReply(id, ticket.subject, body.reply);
    }

    return NextResponse.json({ success: true, ticket: updated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
