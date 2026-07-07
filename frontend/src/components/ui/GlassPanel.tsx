'use client';

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  glowColor?: "purple" | "blue" | "pink" | "none";
}

export function GlassPanel({ children, className, glowColor = "none", ...props }: GlassPanelProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden",
        className
      )}
      {...props}
    >
      {glowColor !== "none" && (
        <div className={cn(
          "absolute -top-24 -right-24 w-48 h-48 rounded-full mix-blend-screen filter blur-[80px] opacity-30 pointer-events-none",
          glowColor === "purple" && "bg-purple-500",
          glowColor === "blue" && "bg-blue-500",
          glowColor === "pink" && "bg-pink-500"
        )} />
      )}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}
