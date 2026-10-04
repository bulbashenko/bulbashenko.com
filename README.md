This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

Production runs on a Hetzner server under [Coolify](https://coolify.io), behind Cloudflare:

- Pushing to `main` builds a Docker image in GitHub Actions (`.github/workflows/deploy.yml`), pushes it to `ghcr.io/bulbashenko/bulbashenko.com` and triggers a Coolify deploy.
- Postgres runs next to the app on the same server. Uploaded images and the weekly skull video live in Cloudflare R2 (`https://media.bulbashenko.com`).
- Schema changes: there are no migrations, so run `npx prisma db push` against production through an SSH tunnel.

See [docs/deployment.md](docs/deployment.md) for the full setup, environment variables, mail server and backups.
