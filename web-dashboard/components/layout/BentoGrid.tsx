"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className={cn(
        "grid grid-cols-1 lg:grid-cols-12 gap-4 w-full",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface BentoItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  rowSpan?: number;
}

export function BentoItem({ children, className, colSpan = 3, rowSpan = 3 }: BentoItemProps) {
  const colSpans = {
    1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3", 4: "lg:col-span-4",
    5: "lg:col-span-5", 6: "lg:col-span-6", 7: "lg:col-span-7", 8: "lg:col-span-8",
    9: "lg:col-span-9", 10: "lg:col-span-10", 11: "lg:col-span-11", 12: "lg:col-span-12",
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
      }}
      className={cn(
        "col-span-1", // Default for mobile
        colSpans[colSpan],
        className
      )}
      style={{ gridRow: `span ${rowSpan} / span ${rowSpan}` }}
    >
      {children}
    </motion.div>
  );
}
