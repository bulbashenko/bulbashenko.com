import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Aleksandr Albekov";
  const subtitle = searchParams.get("subtitle") ?? "DevOps Engineer";
  const description = searchParams.get("description") ?? "Networks, Linux, containers, Kubernetes, and CI/CD pipelines.";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bulbashenko.com";
  const avatarUrl = `${siteUrl}/ava.JPG`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          fontFamily: "monospace",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Green scanline effect */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(transparent 50%, rgba(0,255,0,0.015) 50%)",
            backgroundSize: "100% 4px",
          }}
        />

        {/* Border */}
        <div
          style={{
            position: "absolute",
            inset: "20px",
            border: "1px solid rgba(0,255,0,0.2)",
            borderRadius: "4px",
          }}
        />

        {/* Corner dots */}
        {["top:24px;left:24px", "top:24px;right:24px", "bottom:24px;left:24px", "bottom:24px;right:24px"].map(
          (pos, i) => {
            const [top, topVal, side, sideVal] = pos.split(/[;:]/).map((s) => s.trim());
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  [top]: topVal,
                  [side]: sideVal,
                  width: "6px",
                  height: "6px",
                  backgroundColor: "#00ff00",
                  borderRadius: "50%",
                }}
              />
            );
          }
        )}

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "48px",
            flex: 1,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "160px",
              height: "160px",
              borderRadius: "50%",
              border: "2px solid rgba(0,255,0,0.4)",
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
            }}
          >
            <img
              src={avatarUrl}
              width="160"
              height="160"
              style={{ objectFit: "cover" }}
            />
          </div>

          {/* Text */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
            {/* Prompt line */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#00ff00", fontSize: "18px" }}>$</span>
              <span style={{ color: "rgba(0,255,0,0.5)", fontSize: "16px", letterSpacing: "2px" }}>
                whoami
              </span>
            </div>

            {/* Name */}
            <div
              style={{
                fontSize: "52px",
                fontWeight: "bold",
                color: "#00ff00",
                lineHeight: 1.1,
                letterSpacing: "-1px",
              }}
            >
              {title}
            </div>

            {/* Subtitle */}
            <div
              style={{
                fontSize: "24px",
                color: "rgba(0,255,0,0.7)",
                letterSpacing: "3px",
                textTransform: "uppercase",
              }}
            >
              {subtitle}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: "18px",
                color: "rgba(0,255,0,0.5)",
                lineHeight: 1.5,
                maxWidth: "600px",
              }}
            >
              {description}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "32px",
            borderTop: "1px solid rgba(0,255,0,0.15)",
            paddingTop: "20px",
          }}
        >
          <span style={{ color: "rgba(0,255,0,0.4)", fontSize: "14px", letterSpacing: "2px" }}>
            bulbashenko.com
          </span>
          <span style={{ color: "rgba(0,255,0,0.3)", fontSize: "14px" }}>
            ▮
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
