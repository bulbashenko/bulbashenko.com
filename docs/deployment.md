# Deployment

## Overview

| Piece | Where |
| --- | --- |
| Server (core) | Hetzner Cloud `hel1-core` (CX22, hel1, 65.109.174.215, private 192.168.100.2), Ubuntu 24.04, hostname `mail.bulbashenko.com`, Hetzner Backups on. Bootstrapped by cloud-init (user, SSH hardening, swap, fail2ban). Runs everything below |
| Server (edge) | Hetzner Cloud `hel1-edge` (CX23, hel1, 62.238.18.202, private 192.168.100.3), Ubuntu 24.04, Hetzner Backups on, same cloud-init. Added to Coolify as a second server over the private network. Runs the VPN mesh control server (Headscale), Uptime Kuma, TeamSpeak 6 and side projects |
| VPN mesh | Headscale at `https://hs.bulbashenko.com` on edge. Admin UIs are reachable only from the mesh under `*.int.bulbashenko.com`. See [VPN mesh and admin access](#vpn-mesh-and-admin-access) |
| Private network | Hetzner network `hel1-net`, 192.168.100.0/24. Not `10.x`: Coolify's Docker address pool is `10.0.0.0/8` |
| Firewall | `hel1-core-fw`: 22 open (key-only SSH), 80/443 from Cloudflare IP ranges only, 25/465/587/993 open, 41641/udp (WireGuard). `hel1-edge-fw`: 22, 80/443, 3478/udp, 41641/udp, 9987/udp, 30033/tcp |
| Orchestration | Coolify 4.4 (Traefik v3.7 on 80/443 on both servers), project `bulbashenko.com`. UI at `https://coolify.int.bulbashenko.com` (mesh only, OIDC through Authelia or password). Publicly only the deploy webhook answers at `https://coolify.bulbashenko.com/api/v1/deploy` |
| TLS | Cloudflare Origin Certificate (`bulbashenko.com`, `*.bulbashenko.com`, valid to 2041) in `/data/coolify/proxy/certs`, loaded by `/data/coolify/proxy/dynamic/cloudflare-origin.yaml`. Cloudflare SSL mode: Full (strict). Hosts outside Cloudflare's proxy (`*.int`, `hs.`) get Let's Encrypt certificates from Traefik's `letsencrypt` resolver, which uses DNS-01 on both servers |
| App | Coolify Docker Image application `site`: `ghcr.io/bulbashenko/bulbashenko.com:latest`, port 3000, `bulbashenko.com` + `www` (redirects to apex) |
| Database | Coolify Postgres 17 (`postgres`), daily backup at 03:00 UTC to the Garage `backups` bucket |
| Object storage | Coolify service `garage`, connected to the `coolify` network. Internal S3 endpoint `http://garage-jtpu8t9dvbgcz9m99od91hzt:3900` is used by the site and backups. Public `https://s3.bulbashenko.com` is protected by S3 keys only (CI uploads). The `media` bucket is served publicly as `https://media.bulbashenko.com`, and the admin API at `https://garage.int.bulbashenko.com` is mesh-only behind Authelia forward-auth |
| Single sign-on | Coolify application `auth` from the public repo [bulbashenko/auth](https://github.com/bulbashenko/auth): Authelia (OIDC provider, login portal, forward-auth) at `https://auth.bulbashenko.com`, LLDAP (users and groups) at `https://users.int.bulbashenko.com` (mesh only, Authelia forward-auth). See [Single sign-on](#single-sign-on) |
| Mail | Coolify service `mail` (Stalwart 0.16). SMTP/IMAP at `mail.bulbashenko.com`, web admin at `https://mail.int.bulbashenko.com` (mesh only, Authelia forward-auth, then Stalwart's OIDC login), autoconfig at `autoconfig.` / `autodiscover.` |
| Monitoring | Uptime Kuma at `https://kuma.int.bulbashenko.com` on edge (mesh only, its own login) |
| Voice | TeamSpeak 6 on edge at `ts.bulbashenko.com` (UDP 9987, TCP 30033, server password) |
| DNS / CDN | Cloudflare zone `bulbashenko.com` (registrar: Namecheap) |

## DNS layout (Cloudflare)

- **The core server IP lives in exactly two records:**
  - the apex `A` (proxied);
  - `mail` `A` (DNS-only, IPv4-only on purpose).
- **Every other web hostname on core** is a proxied `CNAME` to `bulbashenko.com`. Moving core to a new server means editing two records.
- **Edge records are DNS-only:** `hs` (A + AAAA; Cloudflare's proxy cannot carry the Tailscale control protocol) and `ts` (A only).
- **`*.int.bulbashenko.com` is never in public DNS.** Those names exist only as Headscale `extra_records`.
- **No `AAAA` records for proxied hosts.** Cloudflare serves IPv6 to visitors and connects to the origin over IPv4.
- **Records are grouped by a comment prefix:** `[web]`, `[storage]`, `[auth]`, `[mail]`, `[mesh]`, `[voice]`. Search the comment in the dashboard to filter.
- **Do not edit by hand** records marked `[mail] managed by Stalwart`: MX, both SPF, DKIM, TLS-RPT. Stalwart rewrites them, for example on DKIM rotation every 90 days.
- **Backups:** export the zone before bulk changes with `cf dns records export -z bulbashenko.com > backup.zone`.
- **Deleting records:** `cf dns records delete` needs `--force`. Without it the command aborts silently.

## Coolify resources

| Name in Coolify | Tags | Notes |
| --- | --- | --- |
| Site — bulbashenko.com | `web`, `ci-deploy` | Deployed by GitHub Actions; no need to press Deploy |
| Postgres — site DB | `database`, `daily-backup` | Internal only |
| Garage — S3 & media | `storage` | Domains come from the `GARAGE_*_URL` env vars, so the Domains field stays empty |
| Stalwart — mail | `mail` | Domains: `mail.int.`, `autoconfig.`, `autodiscover.` |
| Auth — SSO (Authelia + LLDAP) | | Docker Compose from `bulbashenko/auth` (`main`, auto-deploy off: press Deploy after a push). Preserve repository and Connect to predefined network are on. Domains: `auth.` (public), LLDAP at `users.int.` |
| Headscale — VPN mesh | | On hel1-edge. Custom compose; config and ACL policy are file mounts (see [VPN mesh](#vpn-mesh-and-admin-access) for how to change them) |
| Uptime Kuma — monitoring | | On hel1-edge, from the Coolify template, domain `kuma.int.` |
| TeamSpeak 6 | | On hel1-edge, custom compose, no domain |

Every resource carries a short description in Coolify that repeats the key rule for it.

The Traefik version and the ACME resolver are set per server in Servers → <server> → Proxy → Configuration. Both servers use DNS-01 with a Cloudflare token (Zone Read + DNS Write, this zone only) in `/data/coolify/proxy/secrets/cf-dns-token`, passed as `CF_DNS_API_TOKEN_FILE`. Before a minor upgrade, read the Traefik migration notes; the previous compose is backed up next to the operator's secrets.

## SSH access

- Log in as `bulbashenko` (key-only) and use `sudo`.
- Root can only log in from inside the server: `127.0.0.1`, Docker networks and `fd00::/8`, set by the `Match Address` block at the end of `/etc/ssh/sshd_config`. Coolify needs this because it manages localhost over SSH as root from its container. On edge the block also allows `192.168.100.0/24`: Coolify on core manages edge over the private network with its own key.
- External root login is refused (`PermitRootLogin no` in `/etc/ssh/sshd_config.d/10-hardening.conf`).
- Port 8000 (direct Coolify UI) is closed by the Hetzner firewall. Edge reaches it over the private network (Sentinel pushes to `http://192.168.100.2:8000`). Break-glass when the mesh is down: `ssh -L 8000:localhost:8000 bulbashenko@65.109.174.215`.
- SSH stays open to the internet on both servers (key-only, fail2ban), so a broken mesh never locks you out.

## VPN mesh and admin access

Admin UIs are not reachable from the internet. They live under `*.int.bulbashenko.com` and answer only to devices in the VPN mesh.

| Host | Server | Login |
| --- | --- | --- |
| `coolify.int.bulbashenko.com` | core | Coolify (OIDC through Authelia, password as break-glass) |
| `mail.int.bulbashenko.com` | core | Authelia forward-auth, then Stalwart's OIDC login |
| `users.int.bulbashenko.com` | core | Authelia forward-auth (LLDAP) |
| `garage.int.bulbashenko.com` | core | Authelia forward-auth (Garage admin API) |
| `kuma.int.bulbashenko.com` | edge | Uptime Kuma's own login |

- **Control server:** Headscale (`headscale/headscale:v0.29.4`) at `https://hs.bulbashenko.com` on edge, with the embedded DERP relay (region `hel1`, STUN 3478/udp). Tailscale's public relays are the fallback.
- **Joining:** install the Tailscale client and run `tailscale up --login-server https://hs.bulbashenko.com` (mobile apps: "alternate/custom coordination server"). Sign-in goes through Authelia; only the LLDAP group `vpn-users` may join (Authelia policy `vpn_users` and Headscale `allowed_groups`).
- **Servers** join with one-time tagged keys: `docker exec headscale-<uuid> headscale preauthkeys create --tags tag:core --expiration 15m`, then `tailscale up --login-server … --auth-key … --accept-dns=false --accept-routes=false`. hel1-edge is `100.64.0.1` (`tag:edge`), hel1-core is `100.64.0.2` (`tag:core`).
- **ACL** (`policy.hujson`, grants): `group:admins` (`admin@`) reaches `tag:core`, `tag:edge` and its own devices. Servers do not reach each other through the mesh; they use the private network.
- **MagicDNS:** `base_domain` is `int.bulbashenko.com`, `override_local_dns: false`, so only names under `int.bulbashenko.com` go to the mesh resolver. The admin hostnames are `extra_records` (A only).
- **Traefik:** hand-made files `mesh-admin.yaml` (core and edge) define the `*.int` routers with the `mesh-only` middleware (ipAllowList `100.64.0.0/10`, `fd7a:115c:a1e0::/48`) and, where listed, Authelia forward-auth (`sso-forward-auth.yaml`). They outrank the routers Coolify generates for the same hosts. A request with a forged `Host` header that arrives any other way gets 403.
- **Public Coolify:** `coolify-public.yaml` on core lets only `/api/v1/deploy` through on `coolify.bulbashenko.com` (used by GitHub Actions) and refuses everything else that does not come from the mesh.
- **Gotchas:**
  - Tailscale must not SNAT forwarded traffic on the servers (`tailscale set --snat-subnet-routes=false`), or Traefik sees the Docker bridge gateway instead of the mesh address and `mesh-only` refuses everyone.
  - No `AAAA` records for `*.int`: Docker publishes IPv6 ports through `docker-proxy`, which hides the client address.
  - Headscale's config and policy are Coolify file mounts. Updating the compose does not rewrite them: change the file storage in Coolify (or `PATCH /services/{uuid}/storages`), also write the same content to `/data/coolify/services/<uuid>/config/` on edge, then restart the container.
- **`s3.`** stays public and is protected by S3 keys.

## Coolify MCP

Coolify exposes MCP at `https://coolify.int.bulbashenko.com/mcp` (mesh only). It covers inspection plus deploy/start/stop/restart; it cannot create resources. Claude Code is connected with a `read` + `deploy` token:

```sh
claude mcp add --transport http coolify https://coolify.int.bulbashenko.com/mcp \
  --header "Authorization: Bearer <coolify read+deploy token>"
```

## App environment (Coolify)

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Internal URL of the Coolify Postgres resource |
| `JWT_SECRET` | Signs the admin session cookie and the short-lived sign-in flow cookie |
| `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` | Admin sign-in through the SSO provider: `https://auth.bulbashenko.com`, client `bulbashenko-site`. The secret's digest is in the auth app's `OIDC_SITE_SECRET_DIGEST_B64` |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Internal Garage endpoint `http://garage-jtpu8t9dvbgcz9m99od91hzt:3900` and the `app-media` key (`media` bucket only). `S3_REGION` defaults to `garage` |
| `MEDIA_PUBLIC_URL` | `https://media.bulbashenko.com` |
| `SKULL_MANIFEST_URL` | `https://media.bulbashenko.com/skull/current.json` |
| `NEXT_PUBLIC_SITE_URL` | `https://bulbashenko.com` |

`NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` are inlined at build time: they come from GitHub repository variables and are passed as Docker build args.

## GitHub configuration

- Secrets for `deploy.yml`:
  - `COOLIFY_WEBHOOK_URL`: the app's "Deploy Webhook (auth required)", called with **POST**; Coolify 4.4 answers GET with 405.
  - `COOLIFY_TOKEN`: a token with the `deploy` permission only.
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
- `STALWART_PUBLIC_URL=https://mail.int.bulbashenko.com` makes the admin UI work behind Traefik.
- Logs go to `/var/lib/stalwart/logs/` in the data volume (daily rotation). Tracer changes need a service restart; other settings apply with `stalwart-cli create Action/ReloadSettings`.
- `STALWART_RECOVERY_ADMIN` is a break-glass credential. Set it only while recovering, then remove it.
- CLI: `stalwart-cli` (Docker image `ghcr.io/stalwartlabs/cli`). Run it on the server in the service network, with `STALWART_URL=http://stalwart-<uuid>:8080` and an API key.

## Single sign-on

- **Pieces:**
  - Authelia 4.39 is the OIDC issuer and portal at `https://auth.bulbashenko.com`.
  - LLDAP 0.6 holds users and groups; its UI is at `https://users.int.bulbashenko.com` (mesh only, Authelia forward-auth). Password-reset links point there too.
  - Valkey keeps the sessions.
  - Data lives in the shared Postgres, in databases `authelia` and `lldap`, which are part of the daily backup.
  - The config is code in `bulbashenko/auth`: generic settings in `authelia/configuration.yml`, this deployment's clients and rules in `authelia/instance.yml`.
- **Sign-in:** a passkey (counts as two factors when the authenticator verifies the user) or password + TOTP. Nobody can sign up; an admin creates users in LLDAP and they set a password through "Reset password". Login codes come from `noreply@bulbashenko.com`.
- **Groups:**
  - `infra-admins` covers forward-auth apps by default.
  - `site-admins` covers `/admin` on the site.
  - `mail-users` covers mail clients and the Stalwart web UI.
  - `vpn-users` may join the VPN mesh.
- **OIDC clients:**
  - `coolify` (`https://coolify.int.bulbashenko.com/auth/oidc/callback`)
  - `headscale` (`https://hs.bulbashenko.com/oidc/callback`, group `vpn-users`)
  - `bulbashenko-site` (`/api/auth/oidc/callback`)
  - `stalwart-webui`
  - `thunderbird` (public, loopback redirect, used by the add-on in `thunderbird-addon/`)
- **Secrets:**
  - Client secret digests and the RS256 signing key are env vars of the `auth` app.
  - The plain client secrets and the key are kept with the operator's secrets.
  - The site reads its secret from `OIDC_CLIENT_SECRET`.
- **Add a service:** see the repo README. OIDC apps get a client in `instance.yml`. Apps with no login get the Traefik forward-auth middleware. LDAP apps bind to `ldap://lldap:3890` over the `coolify` network.
- **Break-glass:** Coolify (password login, or the SSH tunnel to port 8000), Hetzner, Cloudflare and SSH never depend on the SSO or the mesh. Stalwart falls back to `STALWART_RECOVERY_ADMIN`. The site admin panel has no local login: if Authelia is down, fix it from Coolify or over SSH.
- **Server hostname gotcha:** the host's own name is `mail.bulbashenko.com`, mapped to `127.0.1.1` in `/etc/hosts`, and containers inherit that. So Authelia sends mail to `submissions://host.docker.internal:465` and verifies the certificate as `mail.bulbashenko.com`.

## Backups and restore

- **Whole servers**: Hetzner Backups on both, a daily snapshot kept for 7 days. Core covers mail, Garage data and the Coolify config; edge covers Headscale, Uptime Kuma and TeamSpeak data. Restore with `hcloud server rebuild --image <backup-id> hel1-core` (or `hel1-edge`).
- **Postgres**: daily dump by Coolify to the Garage `backups` bucket (7 local, 30 in S3) through the internal endpoint. Coolify blocks private S3 endpoints by default, so `garage-jtpu8t9dvbgcz9m99od91hzt` and `10.0.1.0/24` are listed in Settings → Advanced → Allowed internal targets. The bucket is on the same server, so the Hetzner snapshots are the off-disk copy. Restore from the Coolify UI or with `pg_restore --clean --no-owner`.

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
