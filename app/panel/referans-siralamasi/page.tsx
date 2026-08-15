import { createMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { motion } from "motion/react";

export const metadata: Metadata = createMetadata({
  title: "Referans Sıralaması",
  description: "Referans sıralaması listesi.",
  path: "/panel/referans-siralamasi",
  noIndex: true,
});

export default function ReferansSiralamasiPage() {
  return (
    <div className="p-6 md:p-8">
      <motion.div
        className="rounded-xl border border-border bg-card p-6 shadow-lg"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">
          Referans Sıralaması
        </h1>
        <p className="mt-1 text-muted-foreground">
          Referans sıralama verisi API ile doldurulacaktır.
        </p>
        <div className="mt-6 rounded-lg border border-border p-8 text-center text-muted-foreground">
          Henüz veri yok.
        </div>
      </motion.div>
    </div>
  );
}
