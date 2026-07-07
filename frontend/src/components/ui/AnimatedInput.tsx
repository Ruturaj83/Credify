'use client';

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function AnimatedInput({ label, error, className, type, ...props }: AnimatedInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="relative w-full group">
      <input
        type={inputType}
        className={cn(
          "block w-full px-4 pt-6 pb-2 text-white bg-white/5 border border-white/10 rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all peer",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className
        )}
        placeholder=" "
        {...props}
      />
      <label className={cn(
        "absolute text-sm text-neutral-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3",
        error && "text-red-400"
      )}>
        {label}
      </label>
      
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-500 pl-1">{error}</p>
      )}
    </div>
  );
}
