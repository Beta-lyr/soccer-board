"use client";

import { motion, type Variants } from "framer-motion";

interface StaggerListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export function StaggerList({
  children,
  className,
  staggerDelay,
}: StaggerListProps) {
  const customContainer: Variants = staggerDelay
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: staggerDelay } },
      }
    : container;

  return (
    <motion.div
      variants={customContainer}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children.map((child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
