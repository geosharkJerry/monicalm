'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * monicalm 品牌标识
 * ----------------------------------------------------------------
 *  设计语言：「皇冠 + 电路节点 + 心电波形」
 *    - 皇冠：象征「旗舰」「最优」
 *    - 顶部三颗电路节点 + 走线：象征「AI 神经/路由」
 *    - 中部 ECG 波形：象征「实时智能/脉搏」
 *    - 底座双线：稳定与基础设施
 *
 *  使用 `currentColor` 渲染，可在任意明暗主题下随父级文字色变化。
 *  组件零依赖、无网络请求，避免被 Edge Runtime/SSR 影响。
 *
 *  ┌──────────────────────────────────────────────────────────┐
 *  │ <BrandMark className="h-6 w-6" />            （仅图标）   │
 *  │ <BrandLogo size="md" />                      （图标+文字）│
 *  └──────────────────────────────────────────────────────────┘
 */

export interface BrandMarkProps extends React.SVGProps<SVGSVGElement> {
  /** 标题（用于 a11y）。默认 "monicalm" */
  title?: string;
}

/** 仅图标。viewBox 0 0 64 64，使用 currentColor 着色。 */
export const BrandMark = React.forwardRef<SVGSVGElement, BrandMarkProps>(
  function BrandMark({ className, title = 'monicalm', ...props }, ref) {
    return (
      <svg
        ref={ref}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={title}
        className={cn('shrink-0', className)}
        {...props}
      >
        <title>{title}</title>
        {/* ============ 顶部电路：三颗节点 + 走线 ============ */}
        {/* 左节点 */}
        <circle cx="22" cy="14" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M22 16.2 L22 19 L26 21"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 中节点（最高） */}
        <circle cx="32" cy="9" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M32 11.2 L32 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* 右节点 */}
        <circle cx="42" cy="14" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M42 16.2 L42 19 L38 21"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ============ 皇冠主体（中央高峰 + 两侧斜峰 + 横梁） ============ */}
        {/*
         * 路径解读：
         *  从左下基线起 → 沿左侧斜峰升至上沿 → 内收下行至中央谷底 →
         *  升至中央高峰 → 下行至右内收 → 升至右斜峰 → 落回右下基线 → 闭合。
         */}
        <path
          d="
            M 8 46
            L 14 22
            L 24 30
            L 32 18
            L 40 30
            L 50 22
            L 56 46
            Z
          "
          fill="currentColor"
        />

        {/* ============ 横向 ECG 波形（白色负空间） ============ */}
        <path
          d="
            M 14 38
            L 20 38
            L 23 34
            L 26 41
            L 30 30
            L 34 44
            L 38 34
            L 41 38
            L 50 38
          "
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          /* 在浅色主题下，这条白线需要变成背景色；用 CSS 变量优雅切换 */
          style={{ stroke: 'var(--brand-mark-cut, #ffffff)' }}
        />

        {/* ============ 底座：粗带 + 细线 ============ */}
        <rect x="8" y="46" width="48" height="6" fill="currentColor" />
        <rect x="10" y="54" width="44" height="2.5" fill="currentColor" />
      </svg>
    );
  },
);

/* ============================================================ *
 *  组合：BrandLogo = Mark + Wordmark                            *
 * ============================================================ */

export interface BrandLogoProps {
  /** 图标尺寸。 sm=18px / md=22px / lg=28px / xl=40px */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 是否显示文字。 */
  showWordmark?: boolean;
  /** 强调描边版本(用于登录页 hero)。 */
  emphasized?: boolean;
  className?: string;
}

const SIZE_PX: Record<NonNullable<BrandLogoProps['size']>, number> = {
  sm: 18,
  md: 22,
  lg: 28,
  xl: 40,
};

export function BrandLogo({
  size = 'md',
  showWordmark = true,
  emphasized = false,
  className,
}: BrandLogoProps) {
  const px = SIZE_PX[size];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 select-none',
        className,
      )}
    >
      <span
        className={cn(
          'inline-grid place-items-center rounded-lg',
          emphasized
            ? 'h-10 w-10 bg-fg text-bg shadow-glass'
            : 'h-7 w-7 hairline bg-bg text-fg',
        )}
        style={
          emphasized
            ? ({ '--brand-mark-cut': 'var(--bg, #0a0a0a)' } as React.CSSProperties)
            : undefined
        }
      >
        <BrandMark style={{ width: px - 6, height: px - 6 }} />
      </span>
      {showWordmark && (
        <span
          className={cn(
            'font-medium tracking-tight',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
            size === 'xl' && 'text-xl',
          )}
        >
          monicalm
        </span>
      )}
    </span>
  );
}
