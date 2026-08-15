"use client";

import React, { useEffect, useRef, useCallback } from "react";

export interface SmoothCursorProps {
  className?: string;
  pointsCount?: number;
  lineWidth?: number;
  springStrength?: number;
  dampening?: number;
  color?: string;
  blur?: number;
  mixBlendMode?: GlobalCompositeOperation;
  velocityScale?: boolean;
  trailOpacity?: number;
  smoothFactor?: number;
}

interface TrailPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface CursorPosition {
  x: number;
  y: number;
}

const SmoothCursor: React.FC<SmoothCursorProps> = ({
  className = "",
  pointsCount = 40,
  lineWidth = 0.3,
  springStrength = 0.4,
  dampening = 0.5,
  color = "#fafafa",
  blur = 0,
  mixBlendMode = "source-over",
  velocityScale = false,
  trailOpacity = 1,
  smoothFactor = 1,
}) => {
  const safeDampening = Math.min(Math.max(dampening, 0.1), 0.99);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const trailRef = useRef<TrailPoint[]>([]);
  const cursorRef = useRef<CursorPosition>({ x: 0, y: 0 });
  const cursorVisibleRef = useRef<boolean>(true);
  const scaleRef = useRef<number>(1);
  const animationFrameRef = useRef<number | null>(null);
  const animateRef = useRef<((timestamp: number) => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.filter = blur > 0 ? `blur(${blur}px)` : "none";
  }, [blur]);

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    cursorRef.current = {
      x: canvas.offsetWidth * 0.5,
      y: canvas.offsetHeight * 0.5,
    };

    trailRef.current = Array.from({ length: pointsCount }, () => ({
      x: cursorRef.current.x,
      y: cursorRef.current.y,
      vx: 0,
      vy: 0,
    }));
  }, [pointsCount]);

  const updateCursorPosition = useCallback((x: number, y: number) => {
    cursorRef.current.x = x;
    cursorRef.current.y = y;
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      updateCursorPosition(e.clientX - rect.left, e.clientY - rect.top);
    },
    [updateCursorPosition]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      const canvas = canvasRef.current;
      const touch = e.touches[0];
      if (!canvas || !touch) return;
      const rect = canvas.getBoundingClientRect();
      updateCursorPosition(touch.clientX - rect.left, touch.clientY - rect.top);
    },
    [updateCursorPosition]
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      updateCursorPosition(e.clientX - rect.left, e.clientY - rect.top);
    },
    [updateCursorPosition]
  );

  const handleDocumentMouseEnter = useCallback(() => {
    cursorVisibleRef.current = true;
  }, []);

  const handleDocumentMouseLeave = useCallback(() => {
    cursorVisibleRef.current = false;
  }, []);

  useEffect(() => {
    const animate = () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      trailRef.current.forEach((point, index) => {
        const target =
          index === 0 ? cursorRef.current : trailRef.current[index - 1];
        if (!target) return;
        const spring = index === 0 ? 0.4 * springStrength : springStrength;

        point.vx += (target.x - point.x) * spring;
        point.vy += (target.y - point.y) * spring;

        point.vx *= safeDampening;
        point.vy *= safeDampening;

        point.x += point.vx;
        point.y += point.vy;
      });

      const targetScale = cursorVisibleRef.current ? 1 : 0;
      const scaleSpeed = 0.15;
      scaleRef.current += (targetScale - scaleRef.current) * scaleSpeed;

      const trail = trailRef.current;
      if (trail.length === 0 || trail[0] == null) return;

      ctx.globalCompositeOperation = mixBlendMode;
      ctx.globalAlpha = scaleRef.current * trailOpacity;

      ctx.strokeStyle = color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);

      for (let i = 1; i < trail.length - 1; i++) {
        const pt = trail[i];
        if (pt == null) continue;
        let velocityFactor = 1;
        if (velocityScale && i > 0) {
          const point = pt;
          const velocity = Math.sqrt(point.vx * point.vx + point.vy * point.vy);
          velocityFactor = 1 + Math.min(velocity * 0.5, 2);
        }

        const next = trail[i + 1];
        if (next == null) continue;
        const t = smoothFactor;
        const xMid = 0.5 * (pt.x + next.x) * t + pt.x * (1 - t);
        const yMid = 0.5 * (pt.y + next.y) * t + pt.y * (1 - t);

        ctx.quadraticCurveTo(pt.x, pt.y, xMid, yMid);
        ctx.lineWidth = lineWidth * (pointsCount - i) * velocityFactor;
        ctx.stroke();
      }

      const last = trail[trail.length - 1];
      if (last) ctx.lineTo(last.x, last.y);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animateRef.current = animate;
  }, [
    pointsCount,
    lineWidth,
    springStrength,
    safeDampening,
    color,
    mixBlendMode,
    velocityScale,
    trailOpacity,
    smoothFactor,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctxRef.current = ctx;

    initializeCanvas();

    if (animateRef.current) {
      animationFrameRef.current = requestAnimationFrame(animateRef.current);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("click", handleClick);
    window.addEventListener("resize", initializeCanvas);
    document.addEventListener("mouseenter", handleDocumentMouseEnter);
    document.addEventListener("mouseleave", handleDocumentMouseLeave);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("resize", initializeCanvas);
      document.removeEventListener("mouseenter", handleDocumentMouseEnter);
      document.removeEventListener("mouseleave", handleDocumentMouseLeave);
    };
  }, [
    handleMouseMove,
    handleTouchMove,
    handleClick,
    initializeCanvas,
    handleDocumentMouseEnter,
    handleDocumentMouseLeave,
  ]);

  return (
    <div
      className={`fixed inset-0 w-full h-full pointer-events-none z-[9999] ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

SmoothCursor.displayName = "SmoothCursor";

export default SmoothCursor;
