"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.replace("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "INCORRECT PASSWORD");
      }
    } catch {
      setError("CONNECTION ERROR");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-body">
      <div className="login-wrap">
        <div className="login-box">
          <div className="login-title">ADMIN LOGIN</div>
          <form onSubmit={handleSubmit}>
            <label className="flabel">PASSWORD</label>
            <input
              className="finput"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <div className="login-err">{error || " "}</div>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? "..." : "ENTER"}
              </button>
              <a
                href="/"
                className="btn"
                style={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  padding: "6px 16px",
                  fontSize: 16,
                  letterSpacing: "2px",
                  fontFamily: "var(--fw)",
                }}
              >
                ← SITE
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
