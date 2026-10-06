# bulbashenko.com

Personal website and blog of Aleksandr Albekov — live at **[bulbashenko.com](https://bulbashenko.com)**.

A retro terminal-styled single page with a CRT filter and a weekly pre-rendered ASCII skull background, plus a small admin panel for editing everything on it.

## Features

- Profile, blog posts (Markdown), projects, gallery and CV in English, Russian and Slovak.
- Admin panel at `/admin`: content editing, image uploads, password + TOTP two-factor login, active session management.
- Weekly ASCII skull video background, rendered in GitHub Actions with Playwright and ffmpeg (`scripts/skull-render`).
- Dynamic Open Graph image, sitemap and robots.

## Stack

| Layer | Technology |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Data | PostgreSQL 17 via Prisma 7 |
| Media | Garage (S3-compatible object storage) |
| Hosting | Hetzner Cloud server managed by Coolify, behind Cloudflare |
| Mail | Stalwart, self-hosted for `@bulbashenko.com` |
| CI/CD | GitHub Actions → GHCR → Coolify deploy webhook |

## Local development

Requirements: Node.js 22+ and Docker.

```sh
docker compose up -d postgres            # local Postgres on :5432
cat > .env <<'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bulbashenko
JWT_SECRET=dev-secret-change-me
TOTP_ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000
EOF
npm install
npm run setup                            # create the schema and seed default content
npm run dev                              # http://localhost:3000
```

The seed creates an admin account with the password `admin123`; change it in the admin settings.

Without the S3 variables, uploads are stored in `public/uploads/`.

## Deployment

Pushing to `main` builds a Docker image in GitHub Actions, pushes it to `ghcr.io/bulbashenko/bulbashenko.com` and triggers a deploy in Coolify. Server layout, environment variables, DNS, mail, backups and operational notes are in **[docs/deployment.md](docs/deployment.md)**.

## License

[MIT](LICENSE)
