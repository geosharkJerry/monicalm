'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Hidden right side panel — for model params (Temperature, Top P)
 * or history / document references.
 */
export function RightPanel({
  open,
  onClose,
  title = 'Inspector',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="right"
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className={cn(
            'fixed right-0 top-0 z-30 h-dvh w-[340px] border-l border-line',
            'bg-surface/80 backdrop-blur-md shadow-glass flex flex-col',
          )}
        >
          <div className="flex h-14 items-center justify-between border-b border-line px-4">
            <span className="text-sm font-medium">{title}</span>
            <button
              onClick={onClose}
              className="rounded-md px-2 py-1 text-xs text-muted-fg hover:bg-muted hover:text-fg"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 text-sm">{children}</div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/** Sample Temperature / Top P slider group used by chat workspace. */
export function ModelParamPanel() {
  const [temp, setTemp] = React.useState(0.7);
  const [topP, setTopP] = React.useState(1);
  return (
    <div className="space-y-6">
      <ParamSlider
        label="Temperature"
        value={temp}
        min={0}
        max={2}
        step={0.05}
        onChange={setTemp}
      />
      <ParamSlider
        label="Top P"
        value={topP}
        min={0}
        max={1}
        step={0.01}
        onChange={setTopP}
      />
      <div className="hairline rounded-xl p-3 text-xs text-muted-fg">
        Higher temperature → more creative. Lower Top P → more focused.
      </div>
    </div>
  );
}

function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-fg">{label}</span>
        <span className="font-mono">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-fg"
      />
    </div>
  );
}
