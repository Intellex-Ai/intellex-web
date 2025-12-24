import type { CSSProperties } from 'react';

const SECONDS_SUFFIX = 's';

export const REVEAL_CLASSNAME = 'reveal-on-load';
export const REVEAL_SCROLL_CLASSNAME = 'reveal-on-scroll';
export const REVEAL_SCROLL_DATA_VALUE = 'scroll';

export const createRevealStyle = (delay: number): CSSProperties =>
  ({ '--reveal-delay': `${delay}${SECONDS_SUFFIX}` }) as CSSProperties;
