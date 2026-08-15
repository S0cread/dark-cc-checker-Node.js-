"use client";

import { motion } from "motion/react";
import {
} from "@/components/icons";

export function Features1() {
  const features = [
  ];

  return (
    <section className="w-full py-16 px-4 md:px-32 lg:px-8 bg-background">
      <div className="max-w-[1400px] mx-auto">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="flex flex-col"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-border bg-card shadow-lg">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>
                  <h3 className="text-base tracking-tight font-light text-foreground">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-xs tracking-tight font-light max-w-[20ch] sm:text-base text-muted-foreground leading-relaxed line-clamp-2">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
