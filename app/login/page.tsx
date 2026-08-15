"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const INFO_CARDS = [
  {
    id: 1,
    tag: "Platform",
    title: "mcheck.cc nedir?",
    body: "Kart ve BIN checker için tasarlanmış kapalı devre bir erişim platformudur. Yalnızca kayıtlı ve onaylı kullanıcılara hizmet verir.",
  },
  {
    id: 2,
    tag: "Erişim",
    title: "Üyelik nasıl edinilir?",
    body: "Kayıt olduktan sonra bakiye yükle sayfasından Checker paketini seçerek kripto ile ödeme yapabilirsiniz. Ödeme admin tarafından onaylandığında erişiminiz aktifleşir.",
  },
  {
    id: 3,
    tag: "Güvenlik",
    title: "Veriler güvende mi?",
    body: "Tüm işlem geçmişi yalnızca hesabınıza özeldir. Üçüncü şahıslarla paylaşılmaz. Platform end-to-end şifreli bağlantı ile çalışır.",
  },
  {
    id: 4,
    tag: "Checker",
    title: "Kart checker nasıl çalışır?",
    body: "PayPal altyapısı üzerinden gerçek zamanlı kart doğrulama yapılır. Live / Dead ayrımı otomatik tespit edilir. Toplu işlem ve webhook desteği mevcuttur.",
  },
  {
    id: 5,
    tag: "Admin",
    title: "Admin paneli neler sunar?",
    body: "Kullanıcı yönetimi, bakiye düzenleme, ödeme onaylama, market kart yönetimi ve mini admin atama gibi tam kontrol imkânı sunar.",
  },
  {
    id: 6,
    tag: "Market",
    title: "Market ne işe yarar?",
    body: "Adminler tarafından eklenen kartlar satışa sunulur. Satın alan kullanıcıya 16 haneli kart bilgisi özel sayfasında görünür ve tek tuşla check edilebilir.",
  },
];

function InfoCard({ c }: { c: (typeof INFO_CARDS)[0] }) {
  return (
    <div className="shrink-0 w-[300px] p-5 rounded-xl bg-card/80 backdrop-blur-sm border border-border flex flex-col gap-3 min-h-[170px]">
      <span className="w-fit rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
        {c.tag}
      </span>
      <p className="text-sm font-semibold text-foreground leading-snug">{c.title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/panel";
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", { email: email.trim(), password, redirect: false });
      if (res?.error) { setError("E-posta veya şifre hatalı. Lütfen tekrar deneyin."); return; }
      router.push(callbackUrl);
      router.refresh();
    } catch { setError("Bir hata oluştu. Lütfen tekrar deneyin."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Sol - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-8 lg:p-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <svg className="w-5 h-5 text-accent-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-accent">darkcheck.co</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Hoş Geldiniz</h1>
            <p className="text-base text-muted-foreground">Hesabınıza giriş yaparak panele erişin</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
                {error}
              </motion.p>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">E-posta adresi</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com" required autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-border bg-card/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-200" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">Şifre</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-card/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-200" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeIcon className="w-5 h-5" /> : <EyeOffIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full px-6 py-3 rounded-xl bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity duration-200 disabled:opacity-50">
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </motion.form>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="mt-6 text-center text-sm text-muted-foreground">
            Hesabınız yok mu?{" "}
            <Link href="/kayit" className="font-medium text-accent hover:underline">Kayıt olun</Link>
          </motion.p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="w-full max-w-md mx-auto">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Ana sayfaya dön
          </Link>
        </motion.div>
      </div>

      {/* Sağ - Info Cards */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-l border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />

        <div className="relative z-10 flex items-center w-full py-12">
          <div className="w-full">
            <div className="relative flex overflow-hidden group">
              <div className="flex gap-4 animate-marquee group-hover:[animation-play-state:paused]" style={{ animationDuration: "60s" }}>
                {[...INFO_CARDS, ...INFO_CARDS].map((c, i) => (
                  <InfoCard key={`${c.id}-${i}`} c={c} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent pointer-events-none z-20" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none z-20" />
      </div>
    </div>
  );
}
