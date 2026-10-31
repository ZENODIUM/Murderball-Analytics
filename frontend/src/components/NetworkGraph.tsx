"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";

type NetworkNode = {
  name: string;
  classification: number;
  career_minutes?: number;
};

type NetworkEdge = {
  source: string;
  target: string;
  shared_minutes: number;
  net_per_100s: number;
};

type Point = { x: number; y: number };
type Gesture = {
  kind: "node" | "pan";
  name?: string;
  startX: number;
  startY: number;
  origin: Point;
};

const WIDTH = 960;
const HEIGHT = 620;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

export default function NetworkGraph({ nodes, edges, selected, onSelect }: {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [offsets, setOffsets] = useState<Record<string, Point>>({});
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const gestureRef = useRef<Gesture | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom(value => clamp(value + (event.deltaY < 0 ? .1 : -.1), .6, 2));
    };
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, []);

  const layout = useMemo(() => {
    const chosen = selected && nodes.some(node => node.name === selected) ? selected : nodes[0]?.name;
    const partners = edges
      .filter(edge => edge.source === chosen || edge.target === chosen)
      .sort((a, b) => b.shared_minutes - a.shared_minutes)
      .map(edge => edge.source === chosen ? edge.target : edge.source)
      .filter((name, index, names) => names.indexOf(name) === index)
      .slice(0, 10);
    const otherNames = nodes.map(node => node.name).filter(name => name !== chosen && !partners.includes(name));
    const points = new Map<string, Point>();
    if (chosen) points.set(chosen, CENTER);
    partners.forEach((name, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / partners.length;
      points.set(name, { x: CENTER.x + 215 * Math.cos(angle), y: CENTER.y + 160 * Math.sin(angle) });
    });
    otherNames.forEach((name, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / otherNames.length;
      points.set(name, { x: CENTER.x + 390 * Math.cos(angle), y: CENTER.y + 260 * Math.sin(angle) });
    });
    return { points, partnerNames: new Set(partners) };
  }, [nodes, edges, selected]);

  const position = (name: string): Point => offsets[name] || layout.points.get(name) || CENTER;
  const nodeColor = (classification: number) =>
    classification >= 3 ? "#d3a078" : classification >= 2 ? "#88abb5" : "#a7c9a8";

  const resetView = () => {
    setOffsets({});
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const nodeElement = (event.target as Element).closest<SVGGElement>("[data-node-name]");
    const name = nodeElement?.dataset.nodeName;
    gestureRef.current = {
      kind: name ? "node" : "pan",
      name,
      startX: event.clientX,
      startY: event.clientY,
      origin: name ? position(name) : pan,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const gesture = gestureRef.current;
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!gesture || !bounds) return;
    const dx = (event.clientX - gesture.startX) * WIDTH / bounds.width;
    const dy = (event.clientY - gesture.startY) * HEIGHT / bounds.height;
    if (gesture.kind === "node" && gesture.name) {
      setOffsets(previous => ({
        ...previous,
        [gesture.name!]: {
          x: clamp(gesture.origin.x + dx / zoom, 35, WIDTH - 35),
          y: clamp(gesture.origin.y + dy / zoom, 35, HEIGHT - 35),
        },
      }));
    } else {
      setPan({ x: gesture.origin.x + dx, y: gesture.origin.y + dy });
    }
  };

  return (
    <div className="network-graph">
      <div className="network-graph-toolbar">
        <span>Drag an athlete to arrange the view. Drag the canvas to pan; scroll to zoom.</span>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Zoom out graph" onClick={() => setZoom(value => clamp(value - .15, .6, 2))}><Minus size={16} /></button>
          <span className="network-zoom-value">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom in graph" onClick={() => setZoom(value => clamp(value + .15, .6, 2))}><Plus size={16} /></button>
          <button type="button" aria-label="Reset graph view" onClick={resetView}><Maximize2 size={16} /></button>
        </div>
      </div>
      <svg
        ref={svgRef}
        data-testid="lineup-network"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="group"
        aria-label="Interactive athlete partnership network"
        className="network-graph-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={event => {
          const gesture = gestureRef.current;
          if (gesture?.kind === "node" && gesture.name && Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) < 4) onSelect(gesture.name);
          gestureRef.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => { gestureRef.current = null; }}
      >
        <rect width={WIDTH} height={HEIGHT} fill="#faf9f5" />
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          <circle cx={CENTER.x} cy={CENTER.y} r="215" fill="none" stroke="#dce4dc" strokeDasharray="5 7" />
          <circle cx={CENTER.x} cy={CENTER.y} r="390" fill="none" stroke="#e7ebe4" strokeDasharray="5 8" />
          {edges.filter(edge => edge.source === selected || edge.target === selected).map(edge => {
            const other = edge.source === selected ? edge.target : edge.source;
            if (!layout.partnerNames.has(other)) return null;
            const a = position(edge.source);
            const b = position(edge.target);
            return <line key={`${edge.source}-${edge.target}`} className="network-edge" x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={edge.net_per_100s >= 0 ? "#4d8a6a" : "#b96f56"}
              strokeWidth={clamp(edge.shared_minutes / 35, 2, 5)} strokeOpacity=".7" pointerEvents="none" />;
          })}
          {nodes.map(node => {
            const point = position(node.name);
            const isSelected = node.name === selected;
            const isPartner = layout.partnerNames.has(node.name);
            const isHovered = node.name === hovered;
            const radius = isSelected ? 26 : isPartner ? 20 : 16;
            return <g key={node.name} data-node-name={node.name} role="button" tabIndex={0}
              aria-label={`Select ${node.name}, class ${node.classification.toFixed(1)}`}
              onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(node.name); } }}
              onMouseEnter={() => setHovered(node.name)} onMouseLeave={() => setHovered(null)}
              className="network-node" transform={`translate(${point.x} ${point.y})`}>
              <circle r={radius + (isSelected ? 5 : 0)} fill={isSelected ? "#385548" : "transparent"} />
              <circle r={radius} fill={nodeColor(node.classification)} stroke="#385548" strokeWidth={isSelected ? 2.5 : 1.5} />
              <text textAnchor="middle" dominantBaseline="central" fill="#20332b" fontSize={isSelected ? 14 : 12} fontWeight="700" pointerEvents="none">{node.classification.toFixed(1)}</text>
              {(isSelected || isPartner || isHovered) && <g pointerEvents="none">
                <rect x={-Math.max(44, node.name.length * 3.3)} y={radius + 7} width={Math.max(88, node.name.length * 6.6)} height="21" rx="5" fill={isSelected ? "#385548" : "#fff"} stroke="#d5dfd7" />
                <text y={radius + 21} textAnchor="middle" fill={isSelected ? "#fff" : "#2b4337"} fontSize="11" fontWeight="600">{node.name}</text>
              </g>}
              <title>{node.name}: class {node.classification.toFixed(1)} · {node.career_minutes ?? 0} recorded minutes</title>
            </g>;
          })}
        </g>
      </svg>
    </div>
  );
}
