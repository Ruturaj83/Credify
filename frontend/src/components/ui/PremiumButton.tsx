'use client';

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

interface PremiumButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  isLoading?: boolean;
}

export function PremiumButton({ 
  children, 
  className, 
  variant = "primary", 
  isLoading, 
  disabled,
  ...props 
}: PremiumButtonProps) {
  const baseStyles = "relative overflow-hidden font-semibold rounded-xl px-6 py-3 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]",
    secondary: "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 shadow-lg",
    outline: "border border-white/20 text-white hover:bg-white/5",
    ghost: "text-neutral-400 hover:text-white hover:bg-white/5"
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </motion.button>
  );
}
