
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth.config";
import { getUserById } from "@/lib/db";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/lib/announcements";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
    }

    const dbUser = getUserById(session.user.id);
    const role = dbUser?.role;
    if (role !== "super_admin" && role !== "mini_admin") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const announcements = getAnnouncements();
    return NextResponse.json(announcements);
  } catch (e) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
    }

    const dbUser = getUserById(session.user.id);
    const role = dbUser?.role;
    if (role !== "super_admin" && role !== "mini_admin") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const data = await req.json();
    const { title, content, isActive } = data;

    if (!title || !content) {
      return NextResponse.json({ error: "Başlık ve içerik gerekli" }, { status: 400 });
    }

    const announcement = createAnnouncement({
      title,
      content,
      isActive: isActive ?? true,
      authorId: session.user.id,
      authorName: dbUser?.name || "Admin",
    });

    return NextResponse.json(announcement);
  } catch (e) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
    }

    const dbUser = getUserById(session.user.id);
    const role = dbUser?.role;
    if (role !== "super_admin" && role !== "mini_admin") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const data = await req.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    const updated = updateAnnouncement(id, updateData);
    if (!updated) {
      return NextResponse.json({ error: "Duyuru bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
    }

    const dbUser = getUserById(session.user.id);
    const role = dbUser?.role;
    if (role !== "super_admin" && role !== "mini_admin") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const data = await req.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    const deleted = deleteAnnouncement(id);
    if (!deleted) {
      return NextResponse.json({ error: "Duyuru bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
