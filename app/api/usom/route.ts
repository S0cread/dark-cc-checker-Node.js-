
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json({ error: "Sorgu parametresi gerekli" }, { status: 400 });
    }

    const response = await fetch(`https://siberguvenlik.gov.tr/api/address/index?page=1&q=${encodeURIComponent(q)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("USOM API Hatası:", response.status, text);
      return NextResponse.json({ error: "USOM API hatası", status: response.status }, { status: 500 });
    }

    const data = await response.json();
    console.log("USOM API Cevap:", JSON.stringify(data, null, 2));
    return NextResponse.json(data);
  } catch (e) {
    console.error("USOM API Hatası:", e);
    return NextResponse.json({ error: "Sunucu hatası", message: String(e) }, { status: 500 });
  }
}
