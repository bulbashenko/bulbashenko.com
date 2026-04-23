import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  let name = "Aleksandr Albekov";
  let title = "DevOps Engineer";
  let location = "Slovakia";
  let photo: string | null = null;

  try {
    const profile = await prisma.profile.findFirst();
    if (profile) {
      name = profile.name ?? name;
      title = profile.titleEn ?? title;
      location = profile.location ?? location;
      photo = profile.photo ?? null;
    }
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#090700",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* scanline overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)",
          pointerEvents: "none",
        }} />

        {/* amber glow border */}
        <div style={{
          position: "absolute", inset: 0,
          border: "2px solid rgba(240,208,96,0.2)",
          boxShadow: "inset 0 0 120px rgba(240,208,96,0.04)",
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 48, position: "relative" }}>
          {/* photo or placeholder */}
          <div style={{
            width: 180, height: 180, flexShrink: 0,
            border: "2px solid rgba(240,208,96,0.4)",
            background: "#161000",
            overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {photo
              ? <img src={photo} width={180} height={180} style={{ objectFit: "cover" }} />
              : <span style={{ color: "#7a6018", fontSize: 64 }}>◈</span>
            }
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ color: "#7a6018", fontSize: 22, letterSpacing: 6 }}>
              ▸ PERSONAL SITE
            </div>
            <div style={{
              color: "#f0d060", fontSize: 64, fontWeight: 700,
              letterSpacing: 2, lineHeight: 1,
              textShadow: "0 0 30px rgba(240,208,96,0.5)",
            }}>
              {name}
            </div>
            <div style={{ color: "#c8a030", fontSize: 28, letterSpacing: 6, marginTop: 4 }}>
              {title}
            </div>
            <div style={{ color: "#7a6018", fontSize: 20, letterSpacing: 3, marginTop: 4 }}>
              📍 {location}
            </div>
          </div>
        </div>

        {/* bottom domain */}
        <div style={{
          position: "absolute", bottom: 40, right: 80,
          color: "#342800", fontSize: 20, letterSpacing: 4,
        }}>
          bulbashenko.com
        </div>
      </div>
    ),
    { ...size }
  );
}
