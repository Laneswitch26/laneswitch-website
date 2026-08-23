# Cloudflare deployment

This repository is configured as a static multi-page site on Cloudflare Workers Static Assets.

## Local setup

```bash
npm install
npm run dev
```

Wrangler serves the site locally at `http://localhost:8787`.

## Validate without deploying

```bash
npm run check
```

## Deploy

Authenticate once, then deploy:

```bash
npx wrangler login
npm run deploy
```

The initial deployment uses the Cloudflare `workers.dev` domain. Inspect the existing Cloudflare zone and DNS records before assigning `laneswitch.de` as a Worker custom domain, so the current production site is not interrupted.

The repository root is the static asset directory because the existing site consists of top-level HTML files and route folders. `.assetsignore` prevents repository and development files from becoming public assets.
