# Deployment

## Overview

| Piece | Where |
| --- | --- |
| Server | Hetzner Cloud `bulbashenko.com` (CX22, hel1, 65.109.174.215), Ubuntu 24.04, Hetzner Backups on. Bootstrapped by cloud-init (user, SSH hardening, swap, fail2ban). |
| Firewall | Hetzner Cloud Firewall `bulbashenko-fw`: 22 open (key-only SSH), 80/443 from Cloudflare IP ranges only, 25/465/587/993 open |
| Orchestration | Coolify 4.4 (Traefik on 80/443), project `bulbashenko.com`. UI at `https://coolify.bulbashenko.com` behind Cloudflare Access |
| TLS | Cloudflare Origin Certificate (`bulbashenko.com`, `*.bulbashenko.com`, valid to 2041) in `/data/coolify/proxy/certs`, loaded by `/data/coolify/proxy/dynamic/cloudflare-origin.yaml`. Cloudflare SSL mode: Full (strict) |
| App | Coolify Docker Image application `site`: `ghcr.io/bulbashenko/bulbashenko.com:latest`, port 3000, `bulbashenko.com` + `www` (redirects to apex) |
| Database | Coolify Postgres 17 (`postgres`), daily backup at 03:00 UTC to the Garage `backups` bucket |
| Object storage | Coolify service `garage`. S3 API at `https://s3.bulbashenko.com`, the `media` bucket served as `https://media.bulbashenko.com`, admin API at `https://garageadmin.bulbashenko.com` behind Access |
| Mail | Coolify service `mail` (Stalwart 0.16). SMTP/IMAP at `mail.bulbashenko.com`, web admin at `https://mailadmin.bulbashenko.com` behind Access, autoconfig at `autoconfig.` / `autodiscover.` |
| DNS / CDN | Cloudflare zone `bulbashenko.com` (registrar: Namecheap) |

## DNS layout (Cloudflare)

- **The server IP lives in exactly two records:**
  - the apex `A` (proxied);
  - `mail` `A` (DNS-only, IPv4-only on purpose).
- **Every other web hostname** is a proxied `CNAME` to `bulbashenko.com`. Moving to a new server means editing two records.
- **No `AAAA` records for proxied hosts.** Cloudflare serves IPv6 to visitors and connects to the origin over IPv4.
- **Records are grouped by a comment prefix:** `[web]`, `[storage]`, `[admin]` (all behind Access), `[mail]`. Search the comment in the dashboard to filter.
- **Do not edit by hand** records marked `[mail] managed by Stalwart`: MX, both SPF, DKIM, TLS-RPT. Stalwart rewrites them, for example on DKIM rotation every 90 days.
- **Backups:** export the zone before bulk changes with `cf dns records export -z bulbashenko.com > backup.zone`.
- **Deleting records:** `cf dns records delete` needs `--force`. Without it the command aborts silently.

## SSH access

- Log in as `bulbashenko` (key-only) and use `sudo`.
- Root can only log in from inside the server: `127.0.0.1`, Docker networks and `fd00::/8`, set by the `Match Address` block at the end of `/etc/ssh/sshd_config`. Coolify needs this because it manages localhost over SSH as root from its container.
- External root login is refused (`PermitRootLogin no` in `/etc/ssh/sshd_config.d/10-hardening.conf`).
- Port 8000 (direct Coolify UI) is closed by the firewall. Use the domain, or a tunnel: `ssh -L 8000:localhost:8000 bulbashenko@65.109.174.215`.

## Cloudflare Access

- `coolify.`, `mailadmin.` and `garageadmin.` require a one-time PIN sent to the owner's email.
- `coolify.` also accepts the service token `coolify-automation` (non-identity policy). GitHub Actions and the Coolify MCP client use it.

## Coolify MCP

Coolify exposes MCP at `https://coolify.bulbashenko.com/mcp`. It covers inspection plus deploy/start/stop/restart; it cannot create resources. Claude Code is connected with a `read` + `deploy` token plus the Access service token headers:

```sh
claude mcp add --transport http coolify https://coolify.bulbashenko.com/mcp \
  --header "Authorization: Bearer <coolify read+deploy token>" \
  --header "CF-Access-Client-Id: <access client id>" \
  --header "CF-Access-Client-Secret: <access client secret>"
```

## App environment (Coolify)

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Internal URL of the Coolify Postgres resource |
| `JWT_SECRET` | Session signing key |
| `TOTP_ENCRYPTION_KEY` | Encrypts the admin TOTP secret in the DB. Changing it breaks existing 2FA |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Garage S3 API and the `app-media` key, which can only access the `media` bucket. `S3_REGION` defaults to `garage` |
| `MEDIA_PUBLIC_URL` | `https://media.bulbashenko.com` |
| `SKULL_MANIFEST_URL` | `https://media.bulbashenko.com/skull/current.json` |
| `NEXT_PUBLIC_SITE_URL` | `https://bulbashenko.com` |

`NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` are inlined at build time: they come from GitHub repository variables and are passed as Docker build args.

## GitHub configuration

- Secrets for `deploy.yml`:
  - `COOLIFY_WEBHOOK_URL`: the app's "Deploy Webhook (auth required)", called with **POST**; Coolify 4.4 answers GET with 405.
  - `COOLIFY_TOKEN`: a token with the `deploy` permission only.
  - `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`: the Access service token.
- Secrets for `skull-background.yml`: `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (the Garage `ci-skull` key, `media` bucket only).
- Variables: `S3_ENDPOINT`, `S3_BUCKET`, `MEDIA_PUBLIC_URL`, `NEXT_PUBLIC_SITE_URL`, optionally `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
- The GHCR package inherits the public repository's visibility, so Coolify pulls it without credentials.

## Garage

- The Coolify template (v2.1.0) runs `garage server` without `--single-node`. After a fresh install, apply the layout once with `garage layout assign -z hel1 -c 20G <node>` and `garage layout apply --version 1`.
- Buckets:
  - `media`: website access on, global alias `media.bulbashenko.com`.
  - `backups`: Coolify database backups.
- Keys, each limited to one bucket: `app-media` → `media`, `ci-skull` → `media`, `coolify-backups` → `backups`.
- The three routes come from the template variables `GARAGE_S3_API_URL`, `GARAGE_WEB_URL` and `GARAGE_ADMIN_URL`. Change their values only. Removing a variable or editing the compose file drops all routes.

## Mail (Stalwart)

- Hostname `mail.bulbashenko.com`. Storage is RocksDB in the service volume, and accounts live in Stalwart's internal directory.
- `mail` has an **A record only**. IPv6 published ports go through Docker's userland proxy, which would hide the real sender IP from SPF/DMARC checks and auto-ban.
- TLS: Let's Encrypt via DNS-01. The `AcmeProvider` is configured with challenge `Dns01`, and Stalwart renews by itself.
- DNS: the `DnsServer` (Cloudflare) reads its token from the service variable `CF_DNS_API_TOKEN`. The token allows DNS edit on this zone only.
- The domain publishes `dkim`, `spf`, `mx` and `tlsRpt` automatically, which keeps DKIM rotation (every 90 days) in sync with DNS.
- DMARC is managed by hand: `v=DMARC1; p=none; rua=mailto:dmarc@bulbashenko.com; adkim=s; aspf=s`. Move to `p=quarantine` once reports are clean.
- SRV, MTA-STS, CAA and the autoconfig CNAMEs are not auto-published, because they would point clients at `mail.` on port 443, which the firewall closes.
- `autoconfig.` and `autodiscover.` are proxied records routed by Traefik to Stalwart's HTTP listener.
- Account `admin@bulbashenko.com` (role Admin), with aliases `postmaster@`, `abuse@` and `dmarc@`.
- Thunderbird: IMAP 993 SSL/TLS, SMTP 465 SSL/TLS.
- `STALWART_PUBLIC_URL=https://mailadmin.bulbashenko.com` makes the admin UI work behind Traefik.
- `STALWART_RECOVERY_ADMIN` is a break-glass credential. Set it only while recovering, then remove it.
- CLI: `stalwart-cli` (Docker image `ghcr.io/stalwartlabs/cli`). Run it on the server in the service network, with `STALWART_URL=http://stalwart-<uuid>:8080` and an API key.

## Backups and restore

- **Whole server**: Hetzner Backups, a daily snapshot kept for 7 days. Covers mail, Garage data and the Coolify config. Restore with `hcloud server rebuild --image <backup-id> bulbashenko.com`.
- **Postgres**: daily dump by Coolify to the Garage `backups` bucket (7 local, 30 in S3). The bucket is on the same server, so the Hetzner snapshots are the off-disk copy. Restore from the Coolify UI or with `pg_restore --clean --no-owner`.

## Schema changes

The project uses `prisma db push` and has no migration files. To apply a schema change to production, tunnel to the Postgres container:

```sh
ssh -L 55434:<postgres-container-ip>:5432 bulbashenko@65.109.174.215
DATABASE_URL=postgresql://<user>:<password>@localhost:55434/<db> npx prisma db push
```

## Local production check

```sh
docker build -t bulbashenko .
docker compose up -d postgres
docker run --rm --network host -e DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bulbashenko -e JWT_SECRET=dev bulbashenko
```
