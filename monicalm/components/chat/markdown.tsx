'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';

/**
 * Render assistant text with GFM tables, KaTeX math, and highlight.js code blocks.
 * Kept dependency-light: rehype-highlight runs at render time (no shiki SSR cost).
 */
export const Markdown = React.memo(function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn('prose-monica text-[15px] leading-relaxed', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeHighlight, { ignoreMissing: true }]]}
        components={{
          a: (props) => (
            <a
              {...props}
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-4 decoration-muted-fg hover:decoration-fg"
            />
          ),
          p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
          ul: (p) => <ul className="my-3 list-disc pl-5 space-y-1" {...p} />,
          ol: (p) => <ol className="my-3 list-decimal pl-5 space-y-1" {...p} />,
          h1: (p) => <h1 className="mt-4 mb-2 text-xl font-medium" {...p} />,
          h2: (p) => <h2 className="mt-4 mb-2 text-lg font-medium" {...p} />,
          h3: (p) => <h3 className="mt-3 mb-1.5 text-base font-medium" {...p} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
});
