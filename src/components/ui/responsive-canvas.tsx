"use client";

import { useRef, useState, useEffect } from "react";

interface ResponsiveCanvasProps {
  width: number;
  height: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * 响应式画布包装器
 * 在小屏幕上自动缩放内容以适应容器宽度，保持宽高比。
 */
export function ResponsiveCanvas({ width, height, children, className = "" }: ResponsiveCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const update = () => {
      const containerWidth = el.clientWidth;
      setScale(Math.min(1, containerWidth / width));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={containerRef} className={`w-full ${className}`} style={{ height: height * scale }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
