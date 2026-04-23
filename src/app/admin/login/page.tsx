"use client";

import { useState, useRef, useEffect } from "react";

type Step = "password" | "totp";
type TotpMode = "app" | "recovery";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("password");
  const [totpMode, setTotpMode] = useState<TotpMode>("app");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "totp") inputRef.current?.focus();
  }, [step, totpMode]);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requiresTotp) {
          setStep("totp");
        } else {
          window.location.replace("/admin");
        }
      } else {
        setError(data.error || "INCORRECT PASSWORD");
      }
    } catch {
      setError("CONNECTION ERROR");
    } finally {
      setLoading(false);
    }
  }

  async function handleTotp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        window.location.replace("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "INVALID CODE");
        setCode("");
      }
    } catch {
      setError("CONNECTION ERROR");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(mode: TotpMode) {
    setTotpMode(mode);
    setCode("");
    setError("");
  }

  const isApp = totpMode === "app";

  return (
    <div className="admin-body">
      <div className="login-wrap">
        <div className="login-box">
          {step === "password" ? (
            <>
              <div className="login-title">ADMIN LOGIN</div>
              <form onSubmit={handlePassword}>
                <label className="flabel">PASSWORD</label>
                <input
                  className="finput"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <div className="login-err">{error || " "}</div>
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1 }}>
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
            </>
          ) : (
            <>
              <div className="login-title">{isApp ? "2FA CODE" : "RECOVERY CODE"}</div>

              {/* Mode switcher */}
              <div style={{ display: "flex", gap: 0, marginBottom: 18, borderBottom: "1px solid var(--g4)" }}>
                {(["app", "recovery"] as TotpMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: totpMode === m ? "2px solid var(--g1)" : "2px solid transparent",
                      color: totpMode === m ? "var(--g1)" : "var(--g3)",
                      fontFamily: "var(--fw)",
                      fontSize: 11,
                      letterSpacing: "2px",
                      padding: "6px 14px",
                      cursor: "pointer",
                      marginBottom: -1,
                    }}
                  >
                    {m === "app" ? "AUTHENTICATOR APP" : "RECOVERY CODE"}
                  </button>
                ))}
              </div>

              <div style={{ fontFamily: "var(--fw)", fontSize: 12, color: "var(--g3)", letterSpacing: "1px", marginBottom: 14 }}>
                {isApp
                  ? "Enter the 6-digit code from your authenticator app."
                  : "Enter one of your backup recovery codes (format: XXXXXX-XXXXXX)."}
              </div>

              <form onSubmit={handleTotp}>
                <label className="flabel">{isApp ? "AUTHENTICATOR CODE" : "BACKUP CODE"}</label>
                <input
                  ref={inputRef}
                  key={totpMode}
                  className="finput"
                  type="text"
                  inputMode={isApp ? "numeric" : "text"}
                  maxLength={isApp ? 6 : 32}
                  value={code}
                  onChange={(e) =>
                    setCode(isApp ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value.toUpperCase())
                  }
                  placeholder={isApp ? "000000" : "XXXXXX-XXXXXX"}
                  style={isApp ? { letterSpacing: "6px", fontSize: 22, textAlign: "center" } : {}}
                  autoComplete="off"
                />
                <div className="login-err">{error || " "}</div>
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={loading || (isApp ? code.length !== 6 : code.length < 13)}
                    style={{ flex: 1 }}
                  >
                    {loading ? "..." : "VERIFY"}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => { setStep("password"); setError(""); setCode(""); setTotpMode("app"); }}
                  >
                    ← BACK
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
