import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ButtonProps {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export default function Button({
  variant = "primary",
  size = "md",
  children,
  fullWidth = false,
  className = "",
  onClick,
  disabled = false,
  type = "button",
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center
    font-semibold uppercase tracking-wider
    transition-all duration-300 ease-out
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantStyles = {
    primary: `
      bg-[#F5F5F5] text-[#0B0B0C]
      hover:bg-[#141417] hover:text-[#F5F5F5]
      border border-transparent hover:border-[#1F1F24]
    `,
    secondary: `
      bg-transparent text-[#F5F5F5]
      border border-[#1F1F24]
      hover:border-[#F5F5F5] hover:bg-white/5
    `,
  };

  const sizes = {
    sm: "px-4 py-2 text-xs min-h-[36px]",
    md: "px-8 py-4 text-sm min-h-[48px]",
    lg: "px-12 py-5 text-base min-h-[56px]",
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}
