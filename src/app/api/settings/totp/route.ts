import { NextRequest, NextResponse } from "next/server";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  encryptTotpSecret,
  decryptTotpSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "@/lib/totp-crypto";

// GET — current 2FA status + setup data when not enabled
export async function GET() {
  const settings = await prisma.settings.findFirst();

  if (settings?.totpEnabled) {
    return NextResponse.json({
      enabled: true,
      remainingCodes: settings.recoveryHashes.length,
    });
  }

  // Generate (or reuse) a pending secret for the setup flow
  let encryptedSecret = settings?.totpSecret ?? null;
  let plainSecret = "";
  let needsRegen = !encryptedSecret;

  if (!needsRegen) {
    try {
      plainSecret = decryptTotpSecret(encryptedSecret!);
    } catch {
      // Stored value is plaintext from a pre-encryption version — replace it
      needsRegen = true;
    }
  }

  if (needsRegen) {
    plainSecret = generateSecret();
    encryptedSecret = encryptTotpSecret(plainSecret!);
    await prisma.settings.upsert({
      where: { id: 1 },
      update: { totpSecret: encryptedSecret },
      create: { id: 1, passwordHash: "", totpSecret: encryptedSecret },
    });
  }

  const otpauthUrl = generateURI({ label: "admin", issuer: "Bulbashenko", secret: plainSecret });
  const qrCode = await QRCode.toDataURL(otpauthUrl);

  return NextResponse.json({ enabled: false, secret: plainSecret, qrCode });
}

const enableSchema = z.object({ code: z.string().length(6).regex(/^\d+$/) });

// POST — verify authenticator code and activate 2FA, returns one-time recovery codes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = enableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const settings = await prisma.settings.findFirst();
    if (!settings?.totpSecret) {
      return NextResponse.json({ error: "No secret found. Reload the setup page." }, { status: 400 });
    }
    if (settings.totpEnabled) {
      return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
    }

    const plainSecret = decryptTotpSecret(settings.totpSecret);
    const result = verifySync({ token: parsed.data.code, secret: plainSecret });
    if (!result.valid) {
      return NextResponse.json({ error: "INVALID CODE" }, { status: 401 });
    }

    const codes = generateRecoveryCodes();
    const hashes = codes.map(hashRecoveryCode);

    await prisma.settings.update({
      where: { id: 1 },
      data: { totpEnabled: true, recoveryHashes: hashes },
    });

    // Return plaintext codes once — they are never stored unmasked
    return NextResponse.json({ ok: true, recoveryCodes: codes });
  } catch (err) {
    console.error("[POST /api/settings/totp]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — disable 2FA and wipe all related data
export async function DELETE() {
  try {
    await prisma.settings.update({
      where: { id: 1 },
      data: { totpEnabled: false, totpSecret: null, recoveryHashes: [] },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/settings/totp]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
