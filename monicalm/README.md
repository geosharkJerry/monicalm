# monicalm

A Genspark-style Next.js 14 frontend + Cloudflare edge gateway for the [new-api](../) Go LLM gateway.

Built across 6 phases:

| Phase | Scope |
|-------|-------|
| 1 | Project skeleton, Tailwind + Shadcn UI design system, layout shell |
| 2 | AI agent workbench: streaming chat, model switcher, multimodal input |
| 3 | Token Center: API key management, recharge dashboard, pricing |
| 4 | Admin CMS: users, channels, redeem codes, log stream |
| 5 | BFF / API routes: auth middleware + SSE transparent proxy |
| 6 | Cloudflare Worker edge gateway + Go ↔ KV sync + Next.js Edge runtime |

## Stack

- **Next.js 14** (App Router, Edge runtime where applicable)
- **TypeScript 5**
- **Tailwind CSS 3** + **Shadcn UI** (Radix primitives)
- **Framer Motion** for page transitions
- **react-markdown** + `rehype-highlight` + `remark-math` for rendering
- **Recharts** for analytics
- **Hono.js** on Cloudflare Workers (edge gateway)
- **Go** sync hooks into the existing new-api backend

## Quick start

```bash
pnpm install
pnpm dev           # Next.js on :3000
pnpm wrangler dev  # Edge gateway on :8787
```

See each `phaseN-*.md` doc in `/docs` for the full design notes.
