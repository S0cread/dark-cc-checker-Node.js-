
"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCardCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener("mousemove", updatePosition);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: position.x - 12,
        top: position.y - 10,
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.15s",
      }}
    >
      <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
        <rect x="0.5" y="0.5" width="23" height="19" rx="3" fill="#EF4444" stroke="#DC2626" />
        <rect x="2" y="12" width="12" height="3" rx="0.5" fill="#DC2626" />
        <circle cx="18" cy="10" r="2" fill="#DC2626" />
      </svg>
    </div>
  );
}

