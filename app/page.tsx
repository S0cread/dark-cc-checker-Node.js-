import { createMetadata, siteConfig } from "@/lib/metadata";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { MotionSection, StaggerContainer, StaggerItem } from "@/lib/motion";
import {
  SearchIcon,
  UserIcon,
  SmartphoneIcon,
  MapPinIcon,
  ShieldIcon,
  TelegramIcon,
  DiscordIcon,
} from "@/components/icons";
import { LandingHero } from "@/components/LandingHero";
import { Features1 } from "@/components/features-1";
import { FAQ } from "@/components/faq";

export const metadata: Metadata = createMetadata({
  title: siteConfig.name,
  description: siteConfig.description,
  path: "/",
});

const features = [
  {
    title: "YD kapalı CC Checker",
    description: "Yurt Dışı Kapalı Checker.",
    icon: UserIcon,
  },
  {
    title: "YD kapalı CC Checker",
    description: "Yurt Dışı Kapalı Checker.",
    icon: UserIcon,
  },
];

export default function HomePage(): ReactNode {
  return (
    <div className="min-h-screen bg-background">
      <header className="absolute top-0 left-0 right-0 z-20 border-b border-border/50 bg-background/50 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-accent"
          >
            <SearchIcon className="h-6 w-6" />
            darkcheck.co
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Giriş Yap
            </Link>
            <Link
              href="/kayit"
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
            >
              Kayıt Ol
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <LandingHero />
        <MotionSection className="border-t border-border px-4 py-20">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 text-center md:p-12">
            <h2 className="text-2xl font-bold text-foreground">
              Bize Ulaşın
            </h2>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://t.me/yourtelegramgroup"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-[#0088cc]/20 bg-[#0088cc]/10 px-6 py-3 text-sm font-medium text-[#0088cc] hover:bg-[#0088cc]/15 transition-colors"
              >
                <TelegramIcon className="h-5 w-5" />
                Telegram
              </a>
              <a
                href="https://discord.gg/yourdiscordlink"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-[#5865f2]/20 bg-[#5865f2]/10 px-6 py-3 text-sm font-medium text-[#5865f2] hover:bg-[#5865f2]/15 transition-colors"
              >
                <DiscordIcon className="h-5 w-5" />
                Discord
              </a>
            </div>
          </div>
        </MotionSection>
      </main>

      <footer className="border-t border-border bg-card/30 px-4 py-8">
        <div className="mx-auto max-w-6xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-6">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Giriş
            </Link>
            <Link
              href="/kayit"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Kayıt
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
