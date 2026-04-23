import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

// Amber palette — matches globals.css default
const C = {
  bg:  "#090700",
  bg2: "#0f0c00",
  bg3: "#161000",
  g1:  "#f0d060",
  g2:  "#c8a030",
  g3:  "#7a6018",
  g4:  "#342800",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name        = searchParams.get("title")       ?? "Aleksandr Albekov";
  const jobTitle    = searchParams.get("subtitle")    ?? "DevOps Engineer";
  const description = searchParams.get("description") ?? "Linux systems, containers, pipelines. Building infrastructure that doesn't wake me at 3am.";

  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bulbashenko.com";
  const avatarUrl = `${siteUrl}/ava.JPG`;

  // Load Tiny5 font (matches --fw in globals.css)
  let fontData: ArrayBuffer | null = null;
  try {
    const fontRes = await fetch(
      "https://fonts.gstatic.com/s/tiny5/v3/KFOpCnmCvKFubQKFZg.woff2"
    );
    if (fontRes.ok) fontData = await fontRes.arrayBuffer();
  } catch {
    // fall back to system monospace
  }

  const fonts = fontData
    ? [{ name: "Tiny5", data: fontData, style: "normal" as const }]
    : [];

  const fw = fontData ? "Tiny5, monospace" : "monospace";

  const NAV_ITEMS = ["HOME", "BLOG", "PROJECTS", "CV", "GALLERY", "CONTACT"];
  const ACTIVE = "HOME";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#020202",
          fontFamily: fw,
          padding: "14px",
        }}
      >
        {/* ── APP SHELL ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            backgroundColor: C.bg,
            backgroundImage: `radial-gradient(circle, ${C.g4} 1px, transparent 0)`,
            backgroundSize: "22px 22px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 0 0 2px rgba(0,0,0,0.9), inset 0 0 120px rgba(0,0,0,0.45)",
          }}
        >
          {/* Scanlines overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)",
              zIndex: 9,
              pointerEvents: "none",
            }}
          />

          {/* Phosphor columns */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "repeating-linear-gradient(90deg, transparent 0, transparent 2px, rgba(0,0,0,0.015) 2px, rgba(0,0,0,0.015) 3px)",
              zIndex: 8,
              pointerEvents: "none",
            }}
          />

          {/* Vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse 75% 55% at 50% 44%, rgba(240,208,96,0.07) 0%, transparent 100%), radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.65) 100%)`,
              zIndex: 7,
              pointerEvents: "none",
            }}
          />

          {/* ── STATUS BAR ── */}
          <div
            style={{
              display: "flex",
              flexShrink: 0,
              height: "46px",
              backgroundColor: C.bg2,
              borderBottom: `2px solid ${C.g4}`,
              padding: "0 16px",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontFamily: fw,
                fontSize: "22px",
                color: C.g1,
                textShadow: `0 0 10px ${C.g1}, 0 0 28px rgba(240,208,96,.28)`,
                letterSpacing: "2px",
              }}
            >
              BULBASHENKO
            </span>
            <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
              <span style={{ color: C.g3, fontFamily: fw, fontSize: "14px", letterSpacing: "1px" }}>
                SYS:OK
              </span>
              <span
                style={{
                  color: C.g1,
                  fontSize: "24px",
                  textShadow: `0 0 10px ${C.g1}, 0 0 28px rgba(240,208,96,.28)`,
                  letterSpacing: "3px",
                }}
              >
                {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          {/* ── MAIN ROW ── */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

            {/* ── SIDEBAR ── */}
            <div
              style={{
                width: "180px",
                flexShrink: 0,
                backgroundColor: C.bg2,
                borderRight: `1px solid ${C.g4}`,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Brand */}
              <div
                style={{
                  padding: "14px 14px 11px",
                  borderBottom: `1px solid ${C.g4}`,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{
                    fontFamily: fw,
                    fontSize: "18px",
                    color: C.g1,
                    textShadow: `0 0 10px ${C.g1}, 0 0 28px rgba(240,208,96,.28)`,
                    letterSpacing: "2px",
                    lineHeight: 1,
                  }}
                >
                  {name.split(" ")[0]?.toUpperCase() ?? "ALBEKOV"}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: C.g3,
                    marginTop: "3px",
                    letterSpacing: "1px",
                  }}
                >
                  {jobTitle}
                </span>
              </div>

              {/* Nav */}
              <div style={{ display: "flex", flexDirection: "column", padding: "8px 0" }}>
                {NAV_ITEMS.map((item) => {
                  const isActive = item === ACTIVE;
                  return (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        width: "100%",
                        color: isActive ? C.g1 : C.g3,
                        fontFamily: fw,
                        fontSize: "17px",
                        letterSpacing: "2px",
                        padding: "9px 14px",
                        borderLeft: isActive ? `3px solid ${C.g1}` : "3px solid transparent",
                        backgroundColor: isActive ? C.g4 : "transparent",
                        textShadow: isActive ? `0 0 10px ${C.g1}, 0 0 28px rgba(240,208,96,.28)` : "none",
                      }}
                    >
                      {item}
                    </div>
                  );
                })}
              </div>

              {/* Lang pills */}
              <div
                style={{
                  marginTop: "auto",
                  borderTop: `1px solid ${C.g4}`,
                  padding: "8px 12px",
                  display: "flex",
                  gap: "4px",
                }}
              >
                {["EN", "RU", "SK"].map((l, i) => (
                  <div
                    key={l}
                    style={{
                      fontFamily: fw,
                      fontSize: "11px",
                      letterSpacing: "1px",
                      padding: "2px 7px",
                      border: `1px solid ${C.g4}`,
                      color: i === 0 ? C.g1 : C.g3,
                      backgroundColor: i === 0 ? C.g4 : "transparent",
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* ── WINDOW FRAME ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
              {/* Window titlebar */}
              <div
                style={{
                  flexShrink: 0,
                  backgroundColor: C.g4,
                  borderBottom: `1px solid ${C.g3}`,
                  padding: "5px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: fw,
                    fontSize: "18px",
                    color: C.g1,
                    letterSpacing: "4px",
                    textShadow: `0 0 10px ${C.g1}, 0 0 28px rgba(240,208,96,.28)`,
                  }}
                >
                  ▸ HOME
                </span>
                <div style={{ display: "flex", gap: "5px" }}>
                  {["≡", "_", "□"].map((c) => (
                    <div
                      key={c}
                      style={{
                        width: "20px",
                        height: "20px",
                        border: `1px solid ${C.g3}`,
                        color: C.g3,
                        fontFamily: "monospace",
                        fontSize: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              {/* Window content — HOME section */}
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  padding: "22px 26px",
                  backgroundColor: C.bg,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Hero grid */}
                <div
                  style={{
                    display: "flex",
                    gap: "28px",
                    alignItems: "flex-start",
                    marginBottom: "20px",
                  }}
                >
                  {/* Left: text */}
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    {/* Name */}
                    <div
                      style={{
                        fontFamily: fw,
                        fontSize: "52px",
                        color: C.g1,
                        textShadow: `0 0 10px ${C.g1}, 0 0 28px rgba(240,208,96,.28)`,
                        letterSpacing: "3px",
                        lineHeight: 1,
                        marginBottom: "6px",
                      }}
                    >
                      {name.toUpperCase()}
                    </div>

                    {/* Job title */}
                    <div
                      style={{
                        fontFamily: fw,
                        fontSize: "20px",
                        color: C.g3,
                        letterSpacing: "5px",
                        marginBottom: "14px",
                      }}
                    >
                      {jobTitle.toUpperCase()}
                    </div>

                    {/* Bio */}
                    <div
                      style={{
                        color: C.g2,
                        lineHeight: 1.75,
                        fontSize: "14px",
                        maxWidth: "520px",
                      }}
                    >
                      {description}
                    </div>

                    {/* Links row */}
                    <div style={{ marginTop: "14px", display: "flex", gap: "7px" }}>
                      {["[GITHUB]", "[TELEGRAM]", "[LINKEDIN]"].map((lbl) => (
                        <div
                          key={lbl}
                          style={{
                            fontFamily: fw,
                            fontSize: "12px",
                            color: C.g3,
                            border: `1px solid ${C.g4}`,
                            padding: "3px 10px",
                            letterSpacing: "2px",
                          }}
                        >
                          {lbl}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: avatar */}
                  <div
                    style={{
                      width: "130px",
                      height: "130px",
                      border: `1px solid ${C.g4}`,
                      backgroundColor: C.bg3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={avatarUrl}
                      width="130"
                      height="130"
                      style={{ objectFit: "cover", filter: "grayscale(10%) sepia(30%) hue-rotate(20deg) saturate(80%)" }}
                    />
                  </div>
                </div>

                {/* Skills section header */}
                <div
                  style={{
                    fontFamily: fw,
                    fontSize: "22px",
                    color: C.g1,
                    textShadow: `0 0 10px ${C.g1}, 0 0 28px rgba(240,208,96,.28)`,
                    letterSpacing: "5px",
                    borderBottom: `1px solid ${C.g4}`,
                    paddingBottom: "6px",
                    marginBottom: "12px",
                  }}
                >
                  {">"} SKILLS
                </div>

                {/* Skill cards */}
                <div style={{ display: "flex", gap: "10px" }}>
                  {[
                    { cat: "SYSTEMS & DEVOPS", items: ["Linux", "Docker", "Kubernetes", "Jenkins"] },
                    { cat: "PROGRAMMING",      items: ["Python", "TypeScript", "Bash"] },
                    { cat: "INFRASTRUCTURE",   items: ["Networking", "VPN", "Vercel", "Coolify"] },
                  ].map((skill) => (
                    <div
                      key={skill.cat}
                      style={{
                        flex: 1,
                        backgroundColor: C.bg2,
                        border: `1px solid ${C.g4}`,
                        padding: "10px 12px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: fw,
                          fontSize: "12px",
                          color: C.g3,
                          letterSpacing: "2px",
                          marginBottom: "6px",
                        }}
                      >
                        {skill.cat}
                      </div>
                      {skill.items.map((item) => (
                        <div
                          key={item}
                          style={{
                            fontSize: "12px",
                            color: C.g2,
                            paddingLeft: "12px",
                            lineHeight: 1.7,
                            position: "relative",
                          }}
                        >
                          ▸ {item}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
    }
  );
}
