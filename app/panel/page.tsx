"use client";

import { PanelHomeGraph } from "@/components/panel/PanelHomeGraph";
import { MotionSection } from "@/lib/motion";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const quotes = [
  { title: "Başarı", subtitle: "Başarının anahtarı, hedefe doğru atılan her adımdır." },
  { title: "İnanç", subtitle: "İnandığın şey için çalış, gerisi gelir." },
  { title: "Azim", subtitle: "Bırakmak için değil, devam etmek için doğdun." },
  { title: "Gelecek", subtitle: "Bugünün çabaları, yarının zaferlerini belirler." },
  { title: "Cesaret", subtitle: "Korkma, ilerle; her adım seni hedefe yaklaştırır." },
  { title: "Umut", subtitle: "Umut, karanlık gecelerdeki en parlak yıldızdır." },
  { title: "Çaba", subtitle: "Bugün yorulsan da, yarın kazanacaksın." },
  { title: "Disiplin", subtitle: "Disiplin, hayalleri gerçeğe dönüştüren sihirli değnektir." },
  { title: "Özgüven", subtitle: "Kendine inan, çünkü sen bunu başarabilirsin." },
  { title: "Sevgi", subtitle: "Sevgiyle çalış, her şey güzelleşir." },
  { title: "Sabır", subtitle: "Sabır, en büyük erdemdir." },
  { title: "Adalet", subtitle: "Doğruyu yap, her zaman yanında olursun." },
  { title: "Başlangıç", subtitle: "Her büyük şey, küçük bir adımla başlar." },
  { title: "Hayal", subtitle: "Hayallerini büyüt, onları gerçekleştir." },
  { title: "Sadakat", subtitle: "Sadakat, en değerli sermayedir." },
];

function getTimeBasedGreeting(name: string) {
  const now = new Date();
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Europe/Istanbul",
    }).format(now)
  );
  
  let timeGreeting = "";
  if (hour >= 5 && hour < 11) timeGreeting = "Günaydın";
  else if (hour >= 11 && hour < 15) timeGreeting = "Tünaydın";
  else if (hour >= 15 && hour < 20) timeGreeting = "İyi akşamlar";
  else timeGreeting = "İyi geceler";
  
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  
  return {
    title: `${timeGreeting} ${name}`,
    subtitle: quote.subtitle,
  };
}

export default function PanelHomePage() {
  const { data: session } = useSession();
  const [greeting, setGreeting] = useState({ title: "Kontrol Paneli", subtitle: "Günlük istatistikler canlı olarak güncellenmektedir." });

  useEffect(() => {
    if (session?.user?.name) {
      setGreeting(getTimeBasedGreeting(session.user.name));
    }
  }, [session]);

  return (
    <div className="p-6 md:p-8">
      <MotionSection className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              {greeting.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {greeting.subtitle}
            </p>
          </div>
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            Tüm sistemler aktif
          </span>
        </div>
      </MotionSection>
      <PanelHomeGraph />
    </div>
  );
}
