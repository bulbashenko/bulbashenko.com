import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

// Green LCD palette — matches default site theme
const C = {
  bg:  "#060b06",
  bg2: "#0b130b",
  bg3: "#101a10",
  g1:  "#b8f0a4",
  g2:  "#78b864",
  g3:  "#4a7840",
  g4:  "#243624",
};


export default async function Image() {
  const profile = await prisma.profile.findFirst().catch(() => null);

  const name        = profile?.name    ?? "Aleksandr Albekov";
  const jobTitle    = profile?.titleEn ?? "DevOps Engineer";
  const location    = profile?.location ?? "Slovakia";
  const description = profile?.bioEn   ?? "Linux systems, containers, pipelines. Building infrastructure that doesn't wake me at 3am.";

  const fontTiny5   = readFileSync(join(process.cwd(), "public/fonts/Tiny5.ttf"));
  const fontBitcount = readFileSync(join(process.cwd(), "public/fonts/BitcountSingle.ttf"));

  let avatarSrc: string | null = null;
  try {
    const buf = readFileSync(join(process.cwd(), "public/ava.JPG"));
    avatarSrc = `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    // no avatar
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          backgroundColor: C.bg,
          backgroundImage: `radial-gradient(circle, ${C.g4} 1px, transparent 0)`,
          backgroundSize: "22px 22px",
          fontFamily: "BitcountSingle, monospace",
          position: "relative",
        }}
      >
        {/* Left content area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "64px 56px 56px 72px",
            justifyContent: "space-between",
          }}
        >
          {/* Top: prompt + name block */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
            {/* Prompt line */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px", fontFamily: "Tiny5, monospace" }}>
              <div style={{ display: "flex", color: C.g3, fontSize: 18, letterSpacing: "2px" }}>
                ~/bulbashenko
              </div>
              <div style={{ display: "flex", color: C.g2, fontSize: 18 }}>$</div>
              <div style={{ display: "flex", color: C.g2, fontSize: 18, letterSpacing: "1px" }}>whoami</div>
            </div>

            {/* Name */}
            <div
              style={{
                display: "flex",
                fontFamily: "Tiny5, monospace",
                fontSize: 72,
                color: C.g1,
                letterSpacing: "2px",
                lineHeight: 1,
                marginBottom: "16px",
              }}
            >
              {name.toUpperCase()}
            </div>

            {/* Job title */}
            <div
              style={{
                display: "flex",
                fontFamily: "Tiny5, monospace",
                fontSize: 26,
                color: C.g3,
                letterSpacing: "6px",
                marginBottom: "32px",
              }}
            >
              {jobTitle.toUpperCase()}
            </div>

            {/* Bio */}
            <div
              style={{
                display: "flex",
                fontFamily: "BitcountSingle, monospace",
                fontSize: 18,
                color: C.g2,
                lineHeight: 1.7,
                maxWidth: "560px",
              }}
            >
              {description}
            </div>
          </div>

          {/* Bottom: location + url */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Tags row */}
            <div style={{ display: "flex", gap: "10px" }}>
              {["DEVOPS", "LINUX", "KUBERNETES", "DOCKER"].map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: "flex",
                    fontFamily: "Tiny5, monospace",
                    fontSize: 13,
                    color: C.g3,
                    border: `1px solid ${C.g4}`,
                    padding: "4px 12px",
                    letterSpacing: "2px",
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>

            {/* URL bar + CTA */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: `1px solid ${C.g4}`,
                paddingTop: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", fontFamily: "Tiny5, monospace", color: C.g3, fontSize: 15, letterSpacing: "1px" }}>
                  {location}
                </div>
                <div style={{ display: "flex", fontFamily: "Tiny5, monospace", color: C.g4, fontSize: 15 }}>·</div>
                <div style={{ display: "flex", fontFamily: "Tiny5, monospace", color: C.g2, fontSize: 15, letterSpacing: "2px" }}>
                  bulbashenko.com
                </div>
                <div style={{ display: "flex", fontFamily: "Tiny5, monospace", color: C.g1, fontSize: 18 }}>
                  _
                </div>
              </div>

              {/* CTA button */}
              <div
                style={{
                  display: "flex",
                  fontFamily: "Tiny5, monospace",
                  fontSize: 15,
                  color: C.g1,
                  border: `1px solid ${C.g3}`,
                  padding: "8px 20px",
                  letterSpacing: "3px",
                }}
              >
                [ OPEN TERMINAL ]
              </div>
            </div>
          </div>
        </div>

        {/* Right: photo */}
        <div
          style={{
            display: "flex",
            width: "340px",
            flexShrink: 0,
            alignItems: "stretch",
            position: "relative",
          }}
        >
          {/* Vertical separator */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              left: 0,
              top: "40px",
              bottom: "40px",
              width: "1px",
              backgroundColor: C.g4,
            }}
          />

          {avatarSrc ? (
            <img
              src={avatarSrc}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
                filter: "grayscale(20%) sepia(40%) hue-rotate(60deg) saturate(70%) brightness(0.85)",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: C.bg2,
                color: C.g4,
                fontSize: 14,
                letterSpacing: "2px",
              }}
            >
              NO PHOTO
            </div>
          )}

          {/* Green tint overlay on photo */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to right, ${C.bg}44 0%, transparent 30%), linear-gradient(to bottom, transparent 60%, ${C.bg}88 100%)`,
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Tiny5",        data: fontTiny5,    style: "normal" },
        { name: "BitcountSingle", data: fontBitcount, style: "normal" },
      ],
    }
  );
}
