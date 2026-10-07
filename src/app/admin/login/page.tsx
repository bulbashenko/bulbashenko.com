import Link from "next/link";
import { cn } from "@/lib/cn";
import btn from "@/components/ui/Button.module.css";
import styles from "./Login.module.css";

const ERRORS: Record<string, string> = {
  expired: "SIGN-IN TOOK TOO LONG. TRY AGAIN.",
  denied: "SIGN-IN WAS CANCELLED.",
  failed: "SIGN-IN FAILED. TRY AGAIN.",
  forbidden: "THIS ACCOUNT HAS NO ACCESS TO THE ADMIN PANEL.",
  unavailable: "SIGN-IN SERVICE IS UNAVAILABLE.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error ? (ERRORS[error] ?? ERRORS.failed) : "";

  return (
    <div className={cn("admin-body", styles.wrap)}>
      <div className={styles.box}>
        <div className={styles.title}>ADMIN LOGIN</div>
        <div className={styles.hint}>Sign in with your bulbashenko.com account: passkey, or password and 2FA code.</div>
        <div className={styles.error}>{message || " "}</div>
        <div className={styles.actions}>
          {/* A plain link, not a fetch: the provider round trip must be a top-level navigation. */}
          <a href="/api/auth/oidc/login" className={cn(btn.btn, btn.primary, styles.signIn)}>
            SIGN IN WITH AUTH.BULBASHENKO.COM
          </a>
          <Link href="/" className={styles.siteLink}>← SITE</Link>
        </div>
      </div>
    </div>
  );
}
