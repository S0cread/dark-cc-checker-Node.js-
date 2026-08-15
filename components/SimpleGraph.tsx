"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { cn } from "@/lib/utils";
import { TrendingUpIcon, TrendingDownIcon } from "@/components/icons";

export interface DataPoint {
  value: number;
  label?: string;
}

export interface SimpleGraphProps {
  data: DataPoint[];
  lineColor?: string;
  dotColor?: string;
  width?: string | number;
  height?: number;
  animationDuration?: number;
  showGrid?: boolean;
  gridStyle?: "solid" | "dashed" | "dotted";
  gridLines?: "vertical" | "horizontal" | "both";
  gridLineThickness?: number;
  showDots?: boolean;
  dotSize?: number;
  dotHoverGlow?: boolean;
  curved?: boolean;
  gradientFade?: boolean;
  graphLineThickness?: number;
  calculatePercentageDifference?: boolean;
  animateOnScroll?: boolean;
  animateOnce?: boolean;
  className?: string;
}

const SimpleGraph = ({
  data,
  lineColor = "#ef4444",
  dotColor = "#ef4444",
  width = "100%",
  height = 300,
  animationDuration = 2,
  showGrid = true,
  gridStyle = "solid",
  gridLines = "both",
  gridLineThickness = 1,
  showDots = true,
  dotSize = 6,
  dotHoverGlow = false,
  curved = true,
  gradientFade = false,
  graphLineThickness = 3,
  calculatePercentageDifference = false,
  animateOnScroll = false,
  animateOnce = true,
  className,
}: SimpleGraphProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipRotation, setTooltipRotation] = useState(0);
  const [tooltipOffsetX, setTooltipOffsetX] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: animateOnce, amount: 0.3 });
  const shouldAnimate = animateOnScroll ? isInView : true;

  const { points, pathD } = useMemo(() => {
    if (!data || data.length === 0) return { points: [] as { x: number; y: number; value: number; label?: string }[], pathD: "" };
    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const rangeVal = maxVal - minVal || 1;
    const padding = 0.1;
    const paddedMin = minVal - rangeVal * padding;
    const paddedMax = maxVal + rangeVal * padding;
    const paddedRange = paddedMax - paddedMin;
    const viewBoxWidth = 800;
    const viewBoxHeight = 400;
    const graphPadding = 40;
    const graphWidth = viewBoxWidth - graphPadding * 2;
    const graphHeight = viewBoxHeight - graphPadding * 2;
    const calculatedPoints = data.map((d, i) => {
      const x = graphPadding + (i / (data.length - 1 || 1)) * graphWidth;
      const y = graphPadding + graphHeight - ((d.value - paddedMin) / paddedRange) * graphHeight;
      return { x, y, value: d.value, label: d.label };
    });
    let path = "";
    if (calculatedPoints.length > 0) {
      const first = calculatedPoints[0]!;
      if (curved && calculatedPoints.length > 1) {
        path = `M ${first.x},${first.y}`;
        for (let i = 0; i < calculatedPoints.length - 1; i++) {
          const current = calculatedPoints[i]!;
          const next = calculatedPoints[i + 1]!;
          const controlX1 = current.x + (next.x - current.x) * 0.5;
          const controlY1 = current.y;
          const controlX2 = current.x + (next.x - current.x) * 0.5;
          const controlY2 = next.y;
          path += ` C ${controlX1},${controlY1} ${controlX2},${controlY2} ${next.x},${next.y}`;
        }
      } else {
        path = calculatedPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
      }
    }
    return { points: calculatedPoints, pathD: path };
  }, [data, curved]);

  const widthStyle = typeof width === "number" ? `${width}px` : width;

  const handleMouseMove = (event: React.MouseEvent<SVGElement>, index: number) => {
    if (!svgRef.current || !points[index]) return;
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
    const dotX = points[index].x;
    const deltaX = svgPoint.x - dotX;
    setTooltipRotation(Math.max(-15, Math.min(15, deltaX * 0.2)));
    setTooltipOffsetX(Math.max(-20, Math.min(20, deltaX * 0.15)));
  };

  const getPercentageDifference = (index: number): { percentage: number; isIncrease: boolean } | null => {
    const curr = data[index];
    const prev = data[index - 1];
    if (!calculatePercentageDifference || index === 0 || !curr || !prev) return null;
    const currentValue = curr.value;
    const previousValue = prev.value;
    if (previousValue === 0) return null;
    const difference = currentValue - previousValue;
    const percentage = (difference / Math.abs(previousValue)) * 100;
    return { percentage: Math.abs(percentage), isIncrease: difference >= 0 };
  };

  const gradientFillPath = useMemo(() => {
    if (!gradientFade || points.length === 0) return "";
    const p0 = points[0]!;
    let path = `M ${p0.x},360 L ${p0.x},${p0.y}`;
    if (curved && points.length > 1) {
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i]!;
        const next = points[i + 1]!;
        const controlX1 = current.x + (next.x - current.x) * 0.5;
        const controlY1 = current.y;
        const controlX2 = current.x + (next.x - current.x) * 0.5;
        const controlY2 = next.y;
        path += ` C ${controlX1},${controlY1} ${controlX2},${controlY2} ${next.x},${next.y}`;
      }
    } else {
      for (let i = 1; i < points.length; i++) {
        const p = points[i]!;
        path += ` L ${p.x},${p.y}`;
      }
    }
    const last = points[points.length - 1]!;
    path += ` L ${last.x},360 Z`;
    return path;
  }, [points, curved, gradientFade]);

  return (
    <div
      ref={containerRef}
      className={cn("relative text-foreground", className)}
      style={{ width: widthStyle, height: `${height}px` }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="line-gradient" x1="0" y1="40" x2="0" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {showGrid && (
          <g opacity="0.1">
            {(gridLines === "horizontal" || gridLines === "both") &&
              [0, 1, 2, 3, 4].map((i) => (
                <line
                  key={`h-${i}`}
                  x1="40"
                  y1={40 + (i * 320) / 4}
                  x2="760"
                  y2={40 + (i * 320) / 4}
                  stroke="currentColor"
                  strokeWidth={gridLineThickness}
                  strokeDasharray={gridStyle === "dashed" ? "5,5" : gridStyle === "dotted" ? "1,3" : undefined}
                />
              ))}
            {(gridLines === "vertical" || gridLines === "both") &&
              points.map((point, i) => (
                <line
                  key={`v-${i}`}
                  x1={point.x}
                  y1="40"
                  x2={point.x}
                  y2="360"
                  stroke="currentColor"
                  strokeWidth={gridLineThickness}
                  strokeDasharray={gridStyle === "dashed" ? "5,5" : gridStyle === "dotted" ? "1,3" : undefined}
                />
              ))}
          </g>
        )}
        {gradientFade && (
          <motion.path
            d={gradientFillPath}
            fill="url(#line-gradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: shouldAnimate ? 1 : 0 }}
            transition={{ duration: 0.6, delay: animationDuration, ease: "easeInOut" }}
          />
        )}
        <motion.path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth={graphLineThickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: shouldAnimate ? 1 : 0 }}
          transition={{ duration: animationDuration, ease: "easeInOut" }}
        />
        {showDots &&
          points.map((point, index) => (
            <g
              key={index}
              onMouseEnter={() => {
                setHoveredIndex(index);
                setTooltipRotation(0);
                setTooltipOffsetX(0);
              }}
              onMouseLeave={() => setHoveredIndex(null)}
              onMouseMove={(e) => handleMouseMove(e, index)}
              style={{ cursor: "pointer" }}
            >
              <circle cx={point.x} cy={point.y} r="60" fill="transparent" style={{ pointerEvents: "all" }} />
              {dotHoverGlow && hoveredIndex === index && (
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r={dotSize * 2}
                  fill={dotColor}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ filter: "blur(8px)", pointerEvents: "none" }}
                />
              )}
              <motion.circle
                cx={point.x}
                cy={point.y}
                r={dotSize}
                fill={dotColor}
                stroke="white"
                strokeWidth="2"
                style={{ pointerEvents: "none" }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: hoveredIndex === index ? 1.5 : 1,
                  opacity: shouldAnimate ? 1 : 0,
                }}
                transition={{
                  scale: { type: "spring", stiffness: 400, damping: 25 },
                  opacity: { duration: 0.3, delay: (index / (points.length - 1 || 1)) * animationDuration },
                }}
              />
            </g>
          ))}
        <AnimatePresence>
          {hoveredIndex !== null &&
            points[hoveredIndex] &&
            !(calculatePercentageDifference && hoveredIndex === 0) && (
              <foreignObject
                key={hoveredIndex}
                x={points[hoveredIndex].x - 75}
                y={points[hoveredIndex].y - 84}
                width="150"
                height="84"
                style={{ overflow: "visible", pointerEvents: "none" }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: tooltipOffsetX,
                    rotate: tooltipRotation,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    duration: 0.15,
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    rotate: { type: "spring", stiffness: 300, damping: 30 },
                  }}
                  className="flex items-center justify-center"
                  style={{ pointerEvents: "none" }}
                >
                  <div className="relative">
                    <div className="bg-card text-foreground px-3 py-2 rounded-lg shadow-lg border border-border whitespace-nowrap">
                      {calculatePercentageDifference && hoveredIndex > 0 ? (
                        (() => {
                          const diff = getPercentageDifference(hoveredIndex);
                          if (!diff)
                            return (
                              <div className="text-sm font-semibold">
                                {points[hoveredIndex].value.toFixed(2)}
                              </div>
                            );
                          return (
                            <div className="flex items-center gap-1.5">
                              {diff.isIncrease ? (
                                <TrendingUpIcon className="w-4 h-4 text-red-400" />
                              ) : (
                                <TrendingDownIcon className="w-4 h-4 text-red-400" />
                              )}
                              <span
                                className={cn(
                                  "text-sm font-semibold",
                                  diff.isIncrease ? "text-red-400" : "text-red-400"
                                )}
                              >
                                {diff.isIncrease ? "+" : "-"}
                                {diff.percentage.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-sm font-semibold">
                          {points[hoveredIndex].value.toFixed(2)}
                        </div>
                      )}
                      {data[hoveredIndex]?.label && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {data[hoveredIndex]!.label}
                        </div>
                      )}
                    </div>
                    <div
                      className="absolute left-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-card"
                      style={{ bottom: "-4px", transform: "translateX(-50%)" }}
                    />
                  </div>
                </motion.div>
              </foreignObject>
            )}
        </AnimatePresence>
      </svg>
    </div>
  );
};

SimpleGraph.displayName = "SimpleGraph";
export default SimpleGraph;
