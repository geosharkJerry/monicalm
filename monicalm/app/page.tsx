import Link from 'next/link';
import { ArrowUpRight, Sparkles, Bot, KeyRound } from 'lucide-react';

/**
 * Landing / Explore page.
 * Wide whitespace, oversized typography, hairline cards.
 */
export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <section className="mb-16 animate-fade-in">
        <span className="hairline inline-flex items-center gap-1.5 rounded-full bg-surface/70 px-3 py-1 text-xs text-muted-fg">
          <span className="breathe-dot" /> monicalm · v0.1
        </span>
        <h1 className="mt-5 text-5xl font-medium tracking-tight md:text-6xl">
          One workbench.
          <br />
          <span className="shimmer-text">Every model.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-fg">
          A neutral, Genspark-style frontend over the new-api gateway. Bring
          your own keys, route across providers, watch tokens flow.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/chat"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-fg px-5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
          >
            Open workbench <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-full hairline bg-surface px-5 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            Token Center
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Sparkles,
            title: 'Streaming chat',
            text: 'SSE token streams with a breathing cursor and rich markdown.',
          },
          {
            icon: Bot,
            title: 'Bring-your-own agent',
            text: 'Compose custom system prompts, tools and model routing.',
          },
          {
            icon: KeyRound,
            title: 'Token Center',
            text: 'Manage API keys, view per-model spend, redeem quota.',
          },
        ].map((f) => (
          <div
            key={f.title}
            className="hairline rounded-2xl bg-surface/60 p-5 transition-colors hover:bg-surface-2"
          >
            <f.icon className="h-4 w-4 text-muted-fg" />
            <div className="mt-3 text-sm font-medium">{f.title}</div>
            <div className="mt-1 text-xs leading-relaxed text-muted-fg">
              {f.text}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
