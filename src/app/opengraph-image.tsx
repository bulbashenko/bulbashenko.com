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
          border: "2px solid rgba(240,208,96,0.2)",
        }}
      >
        {/* content row */}
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          {/* photo or placeholder */}
          <div
            style={{
              width: 180,
              height: 180,
              flexShrink: 0,
              border: "2px solid rgba(240,208,96,0.4)",
              background: "#161000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} width={180} height={180} alt="" style={{ objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", color: "#7a6018", fontSize: 64 }}>?</div>
            )}
          </div>

          {/* text */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", color: "#7a6018", fontSize: 20, letterSpacing: 6 }}>
              PERSONAL SITE
            </div>
            <div
              style={{
                display: "flex",
                color: "#f0d060",
                fontSize: 62,
                fontWeight: 700,
                letterSpacing: 2,
                lineHeight: 1,
              }}
            >
              {name}
            </div>
            <div style={{ display: "flex", color: "#c8a030", fontSize: 26, letterSpacing: 6 }}>
              {title}
            </div>
            <div style={{ display: "flex", color: "#7a6018", fontSize: 20, letterSpacing: 3 }}>
              {location}
            </div>
          </div>
        </div>

        {/* domain */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 40,
            right: 80,
            color: "#342800",
            fontSize: 20,
            letterSpacing: 4,
          }}
        >
          bulbashenko.com
        </div>
      </div>
    ),
    { ...size }
  );
}
