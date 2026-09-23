# BARAL Campaigns OS — Jev Social Intelligence MVP

## Objective

Create a read-only social-intelligence layer for BARAL Campaigns OS that captures public/social evidence through the operator's own authenticated browser, classifies the captured comments with Jev when configured, and always routes consequential decisions to one human reviewer.

## Architecture

```text
LOCAL WINDOWS MACHINE                                VERCEL
┌──────────────────────────┐                    ┌──────────────────────────┐
│ Chrome signed-in sessions│                    │ /campaignos dashboard   │
│ Instagram/TikTok/LinkedIn│                    │ Human review console    │
└────────────┬─────────────┘                    └────────────┬─────────────┘
             │ socai CDP/browser                               │
             ▼                                                 │
┌──────────────────────────┐                                   │
│ campaignos-collector.mjs │                                   │
│ normalize + source URLs  │                                   │
└────────────┬─────────────┘                                   │
             │ JSON                                            │
             ├──────── local file / manual import ─────────────►│
             │                                                 │
             └──────── optional HTTPS POST ────────────────────►│
                                                               ▼
                                                    ┌──────────────────────┐
                                                    │ Jev System One       │
                                                    │ typed decisions only │
                                                    └──────────┬───────────┘
                                                               ▼
                                                    ┌──────────────────────┐
                                                    │ Human Gate           │
                                                    │ no auto publishing   │
                                                    └──────────────────────┘
```

### Security boundary

- Social login cookies remain in the operator's Chrome profile.
- The Vercel app never needs Instagram/TikTok/LinkedIn credentials.
- The collector is read-only.
- Do not add CAPTCHA bypass, anti-bot evasion, credential extraction, automated liking/following/commenting, or access to non-public content without authorization.
- Source URLs are preserved for review whenever socai returns them.

## Current native coverage

| Channel | Capture path | Status |
| --- | --- | --- |
| Instagram | socai + signed-in Chrome | MVP active |
| TikTok | socai + signed-in Chrome | MVP active |
| LinkedIn | socai + signed-in Chrome | MVP active |
| YouTube | official Data API or JSON import | adapter ready for next phase |
| X | socai domain skill after live DOM validation | scaffold only |
| Facebook | Graph API for owned assets / socai skill after validation | scaffold only |
| Reddit | API or JSON import | scaffold only |
| Any other source | normalized JSON import | active |

The analysis contract is omnichannel even when a collector adapter is not yet native. Never claim a channel is captured automatically until that adapter has been validated against live pages.

## Jev role

Jev is a decision model, not a scraper and not a text generator. The API route asks bounded questions for each comment:

- stance: supportive / neutral / skeptical / hostile
- primary intent
- dominant objection
- reputational risk score 0–4
- probability that human review is required
- commercial-intent probability
- misinformation-verification probability

The dashboard then aggregates those typed outputs deterministically. Response copy, strategic synthesis and final campaign decisions belong to a separate reasoning layer and/or the human operator.

## Configure Jev

Server environment:

```bash
TYPESAFE_API_KEY=...
TYPESAFE_JEV_MODEL=jev-latest
```

Without `TYPESAFE_API_KEY`, `/api/campaignos/evaluate` intentionally runs a deterministic preview classifier so the dashboard can be reviewed without spending money. The UI labels that mode explicitly. Never use preview heuristics as production research.

## Local collector on Windows

Prerequisites:

- Node.js 20+
- Chrome with the social accounts you are authorized to use already signed in
- current `socai` CLI

Jev Social's published quick path can onboard socai and Jev:

```powershell
npx github:socai-io/jev-social#v0.1.5 onboard
```

Then run the BARAL collector from this repository:

```powershell
node scripts/campaignos-collector.mjs `
  --platform instagram `
  --query "categoría o campaña a investigar" `
  --limit 10 `
  --comments 20 `
  --campaign "Nombre de campaña" `
  --out ".\runs\instagram.json"
```

TikTok:

```powershell
node scripts/campaignos-collector.mjs --platform tiktok --query "tema" --limit 10 --comments 20 --out ".\runs\tiktok.json"
```

LinkedIn:

```powershell
node scripts/campaignos-collector.mjs --platform linkedin --query "tema" --limit 10 --comments 20 --out ".\runs\linkedin.json"
```

Optional direct evaluation against a deployed preview:

```powershell
node scripts/campaignos-collector.mjs `
  --platform instagram `
  --query "tema" `
  --endpoint "https://YOUR-VERCEL-PREVIEW.vercel.app" `
  --out ".\runs\research.json"
```

This creates both the raw normalized run and an `-analyzed.json` file when the endpoint responds.

## Human workflow

1. Define campaign and analysis objective.
2. Run the local collector for each relevant source.
3. Import the resulting JSON into `/campaignos` or POST it to the evaluate endpoint.
4. Review high-risk, skeptical/hostile and high-human-probability comments first.
5. Open the original source URL when available.
6. Mark reviewed items manually.
7. Export the evidence package.
8. Only then pass verified patterns into the Strategy / Red Team / Creative modules of CampaignOS.

## Next implementation phases

### Phase 0 — this MVP
- dashboard
- JSON import/export
- Jev API adapter
- deterministic preview fallback
- local socai collector
- explicit Human Gate

### Phase 1 — evidence store
- Postgres/Supabase or another low-cost append-only store
- campaign/run/comment tables
- content hashes and deduplication
- source snapshots / evidence references
- review state persisted per comment

### Phase 2 — additional channels
- YouTube official commentThreads adapter
- Meta Graph API for owned pages/accounts
- Reddit adapter
- X and Facebook socai site skills only after live page validation

### Phase 3 — CampaignOS intelligence
- objection clustering
- hater / skeptic / journalist simulations seeded by real comments
- pre-bunking recommendations
- Claim Ledger cross-checking
- experiment hypotheses for landing/creative changes
- measured learning loop after launch

## Data contract

Minimal record accepted by the dashboard:

```json
{
  "id": "source-comment-id",
  "platform": "instagram",
  "text": "comment text",
  "author": "optional display name",
  "url": "https://source/post",
  "createdAt": "2026-09-23T12:00:00Z",
  "likes": 12
}
```

A file can be either an array or contain one of `comments`, `records` or `results` arrays.
