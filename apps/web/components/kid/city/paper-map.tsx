"use client";

import { districtAt, type PaperMap } from "@mtct/city";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";
import { playSound } from "../sound";
import { SPRING } from "../tokens";

/**
 * The paper map of the city (pha 12 việc 5), drawn in 2D.
 *
 * When the child pulls the camera all the way out they do not get a smaller 3D city — they get the
 * map: water blue, green green, roads white, each district named, and a light on every star still
 * waiting tonight. Tapping a district flies the camera down into it.
 *
 * Why 2D: a year of building is four hundred metres across, and drawing it in 3D would cost the
 * whole budget for a view where nothing can be made out anyway.
 */
const COLOURS = {
  paper: "#FFF8EC",
  water: "#8FD3F4",
  waterEdge: "#6FBEE8",
  green: "#B7E3A0",
  park: "#CDEEB4",
  road: "#FFFFFF",
  roadEdge: "#E4DCCB",
  ink: "#2B2B3A",
  soft: "#6B6B7B",
  built: "#E6B980",
  empty: "#DCD3C0",
  mission: "#FFD447",
};

export function PaperMapView({
  map,
  cityName,
  onPickDistrict,
  onClose,
}: {
  map: PaperMap;
  cityName: string;
  /** The child tapped a district: fly the camera there. */
  onPickDistrict: (at: { x: number; z: number; name: string }) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0, scale: 1 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const scale = (Math.min(w, h) * 0.92) / (map.extent * 2);
    sizeRef.current = { w, h, scale };
    const px = (x: number) => w / 2 + x * scale;
    const pz = (z: number) => h / 2 + z * scale;
    const line = (points: [number, number][], width: number, colour: string) => {
      if (points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(px(points[0]?.[0] ?? 0), pz(points[0]?.[1] ?? 0));
      for (const [x, z] of points.slice(1)) ctx.lineTo(px(x), pz(z));
      ctx.lineWidth = Math.max(1, width * scale);
      ctx.strokeStyle = colour;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    };
    const blob = (points: [number, number][], fill: string) => {
      if (points.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(px(points[0]?.[0] ?? 0), pz(points[0]?.[1] ?? 0));
      for (const [x, z] of points.slice(1)) ctx.lineTo(px(x), pz(z));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };
    const disc = (x: number, z: number, radius: number, fill: string) => {
      ctx.beginPath();
      ctx.arc(px(x), pz(z), Math.max(1.5, radius * scale), 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    };

    // paper
    ctx.fillStyle = COLOURS.paper;
    ctx.fillRect(0, 0, w, h);

    // green first, then water on top of it
    for (const g of map.green) disc(g.x, g.z, g.radius + 7, COLOURS.green);
    line(map.water.river, map.water.riverWidth + 4, COLOURS.waterEdge);
    line(map.water.river, map.water.riverWidth, COLOURS.water);
    blob(map.water.lake, COLOURS.water);
    for (const pond of map.water.ponds) disc(pond.x, pond.z, pond.radius, COLOURS.water);

    // roads: a soft edge under a white surface, like a printed map
    for (const road of map.roads) line(road.points, road.width + 2.5, COLOURS.roadEdge);
    for (const road of map.roads)
      line(road.points, road.width, road.kind === "path" ? "#F0E6CE" : COLOURS.road);

    // the buildings, as terraces along their belt
    for (const block of map.blocks) {
      ctx.beginPath();
      ctx.moveTo(px(block.from[0]), pz(block.from[1]));
      ctx.lineTo(px(block.to[0]), pz(block.to[1]));
      ctx.lineWidth = Math.max(2, (block.tall ? 7 : 5) * scale);
      ctx.lineCap = "round";
      ctx.strokeStyle = block.built ? COLOURS.built : COLOURS.empty;
      ctx.stroke();
    }

    // landmarks
    const mark = (x: number, z: number, glyph: string, size = 18) => {
      ctx.font = `${size}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(glyph, px(x), pz(z));
    };
    mark(map.landmarks.townHall.x, map.landmarks.townHall.z, "🏛️", 20);
    mark(map.landmarks.wonder.x, map.landmarks.wonder.z, "✨", 20);
    mark(map.landmarks.harbour.x, map.landmarks.harbour.z, "⚓", 18);
    if (map.landmarks.bridge) mark(map.landmarks.bridge.x, map.landmarks.bridge.z, "🌉", 16);

    // tonight's missions glow
    for (const mission of map.missions) {
      ctx.beginPath();
      ctx.arc(px(mission.x), pz(mission.z), 9, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 212, 71, 0.35)";
      ctx.fill();
      mark(mission.x, mission.z, "⭐", 15);
    }

    // district names, on the belt they belong to
    ctx.font = "bold 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const d of map.districts) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = COLOURS.paper;
      ctx.strokeText(d.name, px(d.x), pz(d.z));
      ctx.fillStyle = COLOURS.ink;
      ctx.fillText(d.name, px(d.x), pz(d.z));
    }
  }, [map]);

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  const pick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { w, h, scale } = sizeRef.current;
    const x = (event.clientX - rect.left - w / 2) / scale;
    const z = (event.clientY - rect.top - h / 2) / scale;
    const best = districtAt(map, x, z);
    if (!best) return;
    playSound("cham");
    onPickDistrict({ x: best.x, z: best.z, name: best.name });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={SPRING.pop}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#FFF8EC] p-3"
      data-testid="paper-map"
    >
      <header className="flex w-full items-center justify-between gap-3 px-2 pb-2">
        <span className="font-extrabold text-[26px] text-[#2B2B3A]">Bản đồ {cityName}</span>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[64px] rounded-[28px] bg-white px-6 font-extrabold text-[22px] text-[#2B2B3A] shadow-[0_10px_24px_-16px_rgba(43,43,58,0.6)]"
          data-testid="paper-map-close"
        >
          Về thành phố
        </button>
      </header>
      <canvas
        ref={canvasRef}
        onClick={pick}
        className="h-full w-full rounded-[32px]"
        data-testid="paper-map-canvas"
      />
      <p className="pt-2 font-bold text-[20px] text-[#6B6B7B]">
        Chạm vào một khu để bay tới đó nhé!
      </p>
    </motion.div>
  );
}
