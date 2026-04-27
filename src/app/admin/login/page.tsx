"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { Button, Input, Label } from "@/components/ui";
import styles from "./Login.module.css";

type Step = "password" | "totp";
type TotpMode = "app" | "recovery";

export default function LoginPage() {
  const [step, setStep]         = useState<Step>("password");
  const [totpMode, setTotpMode] = useState<TotpMode>("app");
  const [password, setPassword] = useState("");
  const [code, setCode]         = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
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
        data.requiresTotp ? setStep("totp") : window.location.replace("/admin");
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
    <div className={cn("admin-body", styles.wrap)}>
      <div className={styles.box}>
        {step === "password" ? (
          <>
            <div className={styles.title}>ADMIN LOGIN</div>
            <form onSubmit={handlePassword}>
              <Label>PASSWORD</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
              <div className={styles.error}>{error || " "}</div>
              <div className={styles.actions}>
                <Button variant="primary" type="submit" disabled={loading} style={{ flex: 1 }}>
                  {loading ? "..." : "ENTER"}
                </Button>
                <a href="/" className={styles.siteLink}>← SITE</a>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className={styles.title}>{isApp ? "2FA CODE" : "RECOVERY CODE"}</div>

            <div className={styles.modeSwitcher}>
              {(["app", "recovery"] as TotpMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={cn(styles.modeBtn, totpMode === m && styles.active)}
                  onClick={() => switchMode(m)}
                >
                  {m === "app" ? "AUTHENTICATOR APP" : "RECOVERY CODE"}
                </button>
              ))}
            </div>

            <div className={styles.hint}>
              {isApp
                ? "Enter the 6-digit code from your authenticator app."
                : "Enter one of your backup recovery codes (format: XXXXXX-XXXXXX)."}
            </div>

            <form onSubmit={handleTotp}>
              <Label>{isApp ? "AUTHENTICATOR CODE" : "BACKUP CODE"}</Label>
              <Input
                ref={inputRef}
                key={totpMode}
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
              <div className={styles.error}>{error || " "}</div>
              <div className={styles.actions}>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading || (isApp ? code.length !== 6 : code.length < 13)}
                  style={{ flex: 1 }}
                >
                  {loading ? "..." : "VERIFY"}
                </Button>
                <Button
                  type="button"
                  onClick={() => { setStep("password"); setError(""); setCode(""); setTotpMode("app"); }}
                >
                  ← BACK
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
