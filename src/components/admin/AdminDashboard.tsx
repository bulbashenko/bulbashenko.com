"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostsTab } from "./PostsTab";
import { ProjectsTab } from "./ProjectsTab";
import { ProfileTab } from "./ProfileTab";
import { CVTab } from "./CVTab";
import { GalleryTab } from "./GalleryTab";
import { SettingsTab } from "./SettingsTab";

type Tab = "posts" | "projects" | "profile" | "cv" | "gallery" | "settings";

const TABS: [Tab, string][] = [
  ["posts", "POSTS"],
  ["projects", "PROJECTS"],
  ["profile", "PROFILE"],
  ["cv", "CV"],
  ["gallery", "GALLERY"],
  ["settings", "SETTINGS"],
];

export function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("posts");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin-body">
      <div className="abar">
        <span className="alogo">BULBASHENKO.COM</span>
        <span className="atag">ADMIN PANEL</span>
      </div>
      <div className="dash">
        <div className="admin-sidebar">
          <div style={{ fontFamily: "var(--fw)", fontSize: 15, color: "var(--g4)", letterSpacing: "2px", padding: "0 20px 12px", borderBottom: "1px solid var(--g4)", marginBottom: 8 }}>
            ADMIN PANEL
          </div>
          {TABS.map(([k, l]) => (
            <button key={k} className={`stab${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>{l}</button>
          ))}
          <div className="sdiv" />
          <a href="/" className="slink">← BACK TO SITE</a>
          <button
            className="slink"
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--fw)", fontSize: 15, letterSpacing: "1px", color: "var(--g3)", padding: "8px 20px", textAlign: "left", width: "100%", transition: "color .1s" }}
            onClick={logout}
          >
            LOGOUT
          </button>
        </div>
        <div className="content">
          {tab === "posts"    && <PostsTab />}
          {tab === "projects" && <ProjectsTab />}
          {tab === "profile"  && <ProfileTab />}
          {tab === "cv"       && <CVTab />}
          {tab === "gallery"  && <GalleryTab />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}
