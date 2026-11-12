"use client";

import React, { useState } from "react";
import { Radar as RadarIcon, Sparkles } from "lucide-react";

interface RadarAxis {
  axis: string;
  score: number;
  benchmark: number;
}

export const OpportunityRadar: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [hoveredAxis, setHoveredAxis] = useState<RadarAxis | null>(null);

  const data: RadarAxis[] = [
    { axis: "Algorithms & CS", score: 88, benchmark: 75 },
    { axis: "Backend APIs", score: 94, benchmark: 80 },
    { axis: "Databases & SQL", score: 85, benchmark: 70 },
    { axis: "Cloud & DevOps", score: 72, benchmark: 65 },
    { axis: "STAR Communication", score: 82, benchmark: 75 },
  ];

  // Radar geometry calculations for 5-axis pentagon
  const size = 260;
  const center = size / 2;
  const radius = center - 45;
  const numAxes = data.length;
  const angleStep = (2 * Math.PI) / numAxes;

  const getCoordinates = (value: number, index: number, max: number = 100) => {
    const angle = index * angleStep - Math.PI / 2;
    const distance = (value / max) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y };
  };

  // Generate candidate polygon points
  const candidatePoints = data
    .map((d, i) => {
      const { x, y } = getCoordinates(d.score, i);
      return `${x},${y}`;
    })
    .join(" ");

  // Generate benchmark polygon points
  const benchmarkPoints = data
    .map((d, i) => {
      const { x, y } = getCoordinates(d.benchmark, i);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={`premium-card p-6 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-forest" />
            <span className="text-xs font-mono uppercase tracking-widest text-primary-muted">
              Vector Radar
            </span>
          </div>
          <h3 className="font-heading text-lg font-bold text-primary mt-0.5">
            5-Axis Competency Profile
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-forest">
            <span className="w-2.5 h-2.5 rounded-full bg-forest" /> Candidate
          </span>
          <span className="flex items-center gap-1.5 text-primary-muted">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-stone-400" /> Tier-1 Cutoff
          </span>
        </div>
      </div>

      {/* Radar SVG Diagram */}
      <div className="relative flex items-center justify-center py-2">
        <svg width={size} height={size} className="overflow-visible">
          {/* Concentric grid rings */}
          {[0.25, 0.5, 0.75, 1.0].map((level, lIdx) => {
            const levelPoints = data
              .map((_, i) => {
                const { x, y } = getCoordinates(level * 100, i);
                return `${x},${y}`;
              })
              .join(" ");
            return (
              <polygon
                key={lIdx}
                points={levelPoints}
                fill="none"
                stroke="#E2E4DC"
                strokeWidth="1"
                strokeDasharray={lIdx === 3 ? "none" : "2 2"}
              />
            );
          })}

          {/* Radial axis lines */}
          {data.map((_, i) => {
            const { x, y } = getCoordinates(100, i);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#E2E4DC"
                strokeWidth="1"
              />
            );
          })}

          {/* Benchmark polygon */}
          <polygon
            points={benchmarkPoints}
            fill="none"
            stroke="#9DA094"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Candidate polygon */}
          <polygon
            points={candidatePoints}
            fill="rgba(36, 77, 61, 0.16)"
            stroke="#244D3D"
            strokeWidth="2"
          />

          {/* Data point dots & axis labels */}
          {data.map((d, i) => {
            const coord = getCoordinates(d.score, i);
            const labelCoord = getCoordinates(115, i);
            return (
              <g
                key={d.axis}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredAxis(d)}
                onMouseLeave={() => setHoveredAxis(null)}
              >
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="4"
                  fill="#C9E66B"
                  stroke="#244D3D"
                  strokeWidth="2"
                  className="transition-transform hover:scale-125"
                />
                <text
                  x={labelCoord.x}
                  y={labelCoord.y + 3}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-primary-muted font-medium select-none"
                >
                  {d.axis.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Dynamic Hover Metric Footer */}
      <div className="mt-2 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-mono">
        <span className="text-primary-muted">
          {hoveredAxis ? (
            <>
              Inspecting: <strong className="text-primary">{hoveredAxis.axis}</strong>
            </>
          ) : (
            "Hover vertex to inspect category score"
          )}
        </span>
        <span className="font-semibold text-forest">
          {hoveredAxis ? `${hoveredAxis.score}% (Cutoff: ${hoveredAxis.benchmark}%)` : "Overall Index: 84.2%"}
        </span>
      </div>
    </div>
  );
};

