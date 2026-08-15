
import { NextResponse } from "next/server";

// Shodan API Key: .env dosyasına eklemelisiniz!
// SHODAN_API_KEY=your_api_key_here
const SHODAN_API_KEY = process.env.SHODAN_API_KEY || "";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get("ip");

    console.log("[SHODAN] API KEY:", SHODAN_API_KEY ? "VAR" : "YOK");
    console.log("[SHODAN] IP:", ip);

    if (!ip) {
      return NextResponse.json({ error: "IP adresi gerekli" }, { status: 400 });
    }

    // Shodan API'sini çağır
    const apiUrl = `https://api.shodan.io/shodan/host/${ip}?key=${SHODAN_API_KEY}`;
    console.log("[SHODAN] API URL:", apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    console.log("[SHODAN] Response status:", response.status);

    if (!response.ok) {
      let errorMessage = "Shodan API hatası";
      
      if (response.status === 404) {
        errorMessage = "IP adresi Shodan'da bulunamadı";
      } else if (response.status === 401) {
        errorMessage = "API anahtarı geçersiz veya eksik";
      } else if (response.status === 403) {
        errorMessage = "Bu IP için Shodan'da veri bulunamadı";
      } else {
        errorMessage = `Shodan API hatası: ${response.status}`;
      }
      
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Shodan API hatası:", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
