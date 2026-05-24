---
title: infrastructure
updated: 2026-05-24
---

# Infrastructure topology — beacon-docs

End-to-end reference for everything deployed: where it lives, which account
controls it, and how to recover it.

## When to use

- You need to remember which service holds what
- A teammate is onboarding and needs the topology
- Something is broken and you need to know where to look
- You need to migrate / replicate the setup elsewhere
- Disaster recovery (lost account, transferred domain, etc.)

---

## Topology overview

```
              ┌─────────────────────────────────────────────────┐
              │            users (browsers, AI agents)          │
              └─────────────────────┬───────────────────────────┘
                                    ↓
              ┌─────────────────────────────────────────────────┐
              │   Cloudflare DNS (dan.ns / lila.ns.cloudflare)  │
              │   → resolves beacon-docs.com to CF Pages IPs    │
              └─────────────────────┬───────────────────────────┘
                                    ↓
              ┌─────────────────────────────────────────────────┐
              │   Cloudflare Edge / CDN (320+ POPs)             │
              │   - WAF (managed ruleset)                       │
              │   - Bot Fight Mode (blocks scanners)            │
              │   - Web Analytics (RUM beacon injection)        │
              │   - Redirect rule: www.* → apex (301)           │
              └─────────────────────┬───────────────────────────┘
                                    ↓
              ┌─────────────────────────────────────────────────┐
              │   Cloudflare Pages (project: beacon-docs)       │
              │   - Auto-deploys from GitHub main branch        │
              │   - Build: cd site && npm run build → dist/     │
              │   - Custom domains: beacon-docs.com, www.*      │
              │   - SSL: auto-issued, auto-renewed              │
              └─────────────────────┬───────────────────────────┘
                                    ↑
              ┌─────────────────────┴───────────────────────────┐
              │   GitHub (Juliocbm/beacon-docs)                 │
              │   - Source code (CLI + Astro site under site/)  │
              │   - GitHub Actions: test.yml, docs-lint.yml     │
              │   - Releases (v0.1.0, ...)                      │
              │   - Tags (w1/w2/w3/w4-complete, v0.1.0)         │
              └─────────────────────────────────────────────────┘

              ┌─────────────────────────────────────────────────┐
              │   npm registry (beacon-docs)                    │
              │   - Published manually with `npm publish`       │
              │   - Currently requires GAT (bypass-2fa) OR TOTP │
              └─────────────────────────────────────────────────┘

              ┌─────────────────────────────────────────────────┐
              │   Namecheap (registrar only)                    │
              │   - Owns domain `beacon-docs.com` (renewal here)│
              │   - DNS management delegated to Cloudflare      │
              │     via custom nameservers                      │
              └─────────────────────────────────────────────────┘
```

---

## Account & service inventory

| Service | Account / handle | Purpose | Login URL |
|---|---|---|---|
| **GitHub** | `Juliocbm` | Source of truth, CI, releases | github.com/login |
| **npm** | `jcbautistam` (juliocbm500@gmail.com) | Package publishing | npmjs.com/login |
| **Cloudflare** | juliocbm500@gmail.com | DNS, CDN, Pages, security, analytics | dash.cloudflare.com |
| **Namecheap** | juliocbm500@gmail.com | Domain registrar (renewal only) | ap.www.namecheap.com |

---

## Domain & DNS

| Aspect | Value |
|---|---|
| **Domain** | `beacon-docs.com` |
| **Registrar** | Namecheap |
| **DNS provider** | Cloudflare (delegated) |
| **Nameservers** | `dan.ns.cloudflare.com` + `lila.ns.cloudflare.com` |
| **Renewal** | At Namecheap (NOT Cloudflare) |
| **DNS records** | Auto-managed by Cloudflare Pages (CNAMEs for apex + www) |

**Important**: domain ownership is at Namecheap. To rotate DNS away from
Cloudflare (e.g., move to AWS Route53), change nameservers at Namecheap.
DNSSEC is OFF (Cloudflare requirement at delegation time).

---

## Cloudflare Pages configuration

Project: `beacon-docs` (in Workers & Pages dashboard)

| Setting | Value |
|---|---|
| **Production branch** | `main` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `site` (critical — site/ is the Astro project, not repo root) |
| **Framework preset** | Astro |
| **Compatibility date** | (default, current) |
| **Environment variables** | none required |

### Custom domains

| Domain | Status | Notes |
|---|---|---|
| `beacon-docs.com` | Active | Apex, primary canonical |
| `www.beacon-docs.com` | Active | Redirects to apex via Redirect Rule (see below) |

### Auto-deploy flow

```
git push origin main
   → GitHub fires webhook to Cloudflare
   → Cloudflare clones repo, runs `cd site && npm install && npm run build`
   → On success: deploys dist/ to edge CDN
   → Total time: ~30s typical, ~90s worst case
```

Preview deployments are auto-created for every PR/branch at unique
`*.beacon-docs.pages.dev` URLs.

---

## Cloudflare zone configuration (beacon-docs.com)

These settings live on the **zone** (DNS-level), separate from the Pages project.

### Redirect Rules

| Rule | Type | Trigger | Action |
|---|---|---|---|
| `redirect-www-to-root` | Wildcard | `https://www.*` | 301 → `https://${1}` (preserves path + query string) |

### Security settings

| Setting | Value | Why |
|---|---|---|
| **AI Labyrinth** | OFF | Beacon WANTS AI agents to read its content; labyrinth would sabotage discoverability |
| **Block AI bots** | Off (allow crawlers) | Same reason — discoverability via Claude/GPT/Perplexity is a goal |
| **Bot fight mode** | ON | Blocks known malicious scanners (l9scan etc.) without affecting legit traffic |
| **Challenge passage** | 30 min (default) | Standard |
| **Cloudflare managed ruleset (WAF)** | Always active | Free WAF against SQLi/XSS/etc. |
| **DNSSEC** | OFF | Required by Cloudflare when delegating nameservers |

### Web Analytics

| Aspect | Value |
|---|---|
| **Site token** | `c7cc3ef7a4ce4c4cb43ac434ad5d0718` |
| **Injection method** | Manual (Cloudflare auto-inject doesn't work on Pages projects) |
| **Where script lives** | `site/src/pages/index.astro` (landing) + `site/astro.config.mjs` Starlight `head[]` array (docs pages) |
| **What it tracks** | Page views, visits, visitors, top pages, referrers, browsers, OS, Core Web Vitals |
| **GDPR** | Cookieless, no PII, no banner required |

Token is **public by design** (visible in any browser's view-source). Safe to
commit to git. If rotated, update both injection sites and redeploy.

---

## GitHub Actions workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `.github/workflows/test.yml` | PR + push to main | Runs `npm run typecheck && npm test && npm run build` across `ubuntu × macos × windows` × Node `20 × 22` (6 jobs matrix) |
| `.github/workflows/docs-lint.yml` | PR/push touching `docs/**` or AI files | Runs `node dist/cli.js lint --strict` on the dogfooded docs tree |

Both must pass for the project to be considered green. The Cloudflare Pages
deploy is independent and triggered by Cloudflare on every main push (not by
these workflows).

---

## npm publishing

| Aspect | Value |
|---|---|
| **Package name** | `beacon-docs` |
| **Maintainer** | `jcbautistam` |
| **Current published version** | `0.1.0` |
| **Release workflow** | See [release-process.guide.md](./release-process.guide.md) |
| **Auth method** | Either TOTP (npm 2FA) OR Granular Access Token with bypass-2fa |

---

## Common operations

### Deploy a code/content change to the site

```bash
git push origin main
# Cloudflare Pages auto-deploys in ~30s
```

No manual deploy step. Verify after push:

```bash
curl -sI https://beacon-docs.com | head -3
# Expect: HTTP/2 200 + Server: cloudflare
```

### Verify the redirect rule

```bash
curl -I https://www.beacon-docs.com/install?ref=test
# Expect: HTTP/2 301
# Expect: Location: https://beacon-docs.com/install?ref=test
```

### Verify Web Analytics is recording

```bash
curl -s https://beacon-docs.com | grep -o "cloudflareinsights[^\"]*"
# Expect: cloudflareinsights.com/beacon.min.js
```

### Check site health (quick)

```bash
curl -sI https://beacon-docs.com && \
  curl -sI https://beacon-docs.com/install/ && \
  curl -sI https://beacon-docs.com/commands/ && \
  curl -sI https://www.beacon-docs.com
# All should be 200 OK except the last which should be 301
```

### Rebuild the site locally

```bash
cd site
npm install
npm run build
npm run preview   # serves dist/ on localhost:4321
```

---

## Troubleshooting

### Site returns 525 / SSL error

- Check Cloudflare Pages → Custom domains: domain must be "Active", not "Verifying"
- If just added: wait 2-5 min for SSL cert to issue
- If still failing: remove and re-add the custom domain

### Site returns 522 / connection timeout

- Cloudflare can't reach the origin (Pages). Usually means a Cloudflare incident.
- Check status.cloudflare.com
- Wait it out — no action on your side

### Site returns 404 for a known page

- Verify the build succeeded: Cloudflare Pages → Deployments → most recent
  deployment status
- Check the deployment's build log for errors
- Check that the page exists in `dist/` after local `npm run build`

### `beacon lint --strict` fails in docs-lint workflow

- Run locally: `npm run build && node dist/cli.js lint`
- Fix the reported violations
- Push the fix

### Web Analytics not recording

- Verify script in served HTML: `curl -s https://beacon-docs.com | grep cloudflareinsights`
- If missing: rebuild + redeploy (`git push origin main`)
- If present but no data: visit the site in incognito, then wait 1-2 min and
  refresh the Web Analytics dashboard
- AdBlockers and uBlock Origin sometimes block the beacon. Normal.

### `npm publish` fails with E403 / OTP error

- Likely 2FA enforcement. Either:
  - Provide TOTP code: `npm publish --otp=XXXXXX`
  - OR create a temporary GAT with bypass-2fa at npm settings, set as auth
    token, then publish

### Domain not resolving / DNS issues

- Verify nameservers are still Cloudflare's at Namecheap:
  `nslookup -type=NS beacon-docs.com 8.8.8.8`
- Should return `dan.ns.cloudflare.com` + `lila.ns.cloudflare.com`
- If returns `dns1.registrar-servers.com` (Namecheap default), nameservers
  were reverted somehow — re-set them at Namecheap

---

## Disaster recovery scenarios

### "I lost access to my Cloudflare account"

- Domain ownership is at **Namecheap**, not Cloudflare. You retain control.
- Change nameservers at Namecheap to a different provider (or back to default
  Namecheap DNS)
- Re-add the domain to a new Cloudflare account (or new DNS provider) and
  recreate records
- Pages project is GONE — would need to be reconnected to GitHub from new
  account
- DNS propagation: ~5-30 min

### "I lost access to my npm account"

- Package `beacon-docs` is tied to npm user `jcbautistam`
- Without access, you cannot publish updates
- Recovery: npm support (long process) OR publish under a new package name
  (e.g. `beacon-docs2`) and abandon the old one
- **Prevention**: enable TOTP 2FA on npm + save recovery codes in a password
  manager

### "I lost the domain at Namecheap"

- Domain reverts to public availability after Namecheap's grace + redemption
  periods (~75 days total)
- During grace period, restorable via Namecheap with renewal fee
- If lost: site at `beacon-docs.pages.dev` still works; need to acquire new
  domain and reconfigure DNS + custom domains in Cloudflare Pages

### "GitHub repo is deleted / inaccessible"

- Last clone on local machine is the only copy
- Re-create repo at github.com → push from local
- Re-connect Cloudflare Pages to new repo (Pages settings → Builds &
  deployments → reconnect Git)
- All Cloudflare config (custom domains, security, analytics) is preserved
  on the Pages side
