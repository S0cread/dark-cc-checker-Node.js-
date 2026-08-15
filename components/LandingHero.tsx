"use client";

import Link from "next/link";
import { motion } from "motion/react";
import dynamic from "next/dynamic";

const SynapticShift = dynamic(() => import("@/components/synaptic-shift"), { ssr: false });

export function LandingHero() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-black pt-20">
      <div className="absolute inset-0 z-0">
        <SynapticShift
          color="#ef4444"
          speed={0.4}
          scale={0.6}
          intensity={1.8}
          falloff={1.12}
          complexity={12}
          breathing={true}
        />
      </div>

      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-24 md:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Güvenilir Carder Platformu
          </span>
        </motion.div>

        <motion.h1
          className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Checker Çözümleri ve
          <br />
          <span className="text-accent">Live</span>
          <br />
          Satışları
        </motion.h1>

        <motion.p
          className="mt-6 text-lg text-white/60 md:text-xl max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          CC Checker ve daha fazlası için. Ücretsiz üyelik ile hemen başlayın.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/kayit"
            className="rounded-full bg-accent px-7 py-3.5 font-semibold text-black shadow-lg shadow-accent/30 transition hover:opacity-90 hover:shadow-accent/50 hover:scale-105 text-sm"
          >
            Ücretsiz Kayıt Ol
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/20 bg-white/5 backdrop-blur px-7 py-3.5 font-semibold text-white transition hover:bg-white/10 text-sm"
          >
            Giriş Yap
          </Link>
        </motion.div>

        <motion.div
          className="mt-16 flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {["PayTr", "Stripe", "Iyzico", "Param"].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-accent/60" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
    </section>
  );
}
