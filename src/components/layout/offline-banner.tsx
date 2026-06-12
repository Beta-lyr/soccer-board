"use client";

import { useState, useEffect } from "react";
import { onOfflineChange } from "@/lib/api";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    return onOfflineChange(setIsOffline);
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>当前处于离线模式，数据存储在本地</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
