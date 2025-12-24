'use client';

import { useEffect } from 'react';

const REVEAL_ATTRIBUTE = 'data-reveal';
const REVEAL_VALUE = 'scroll';
const REVEAL_SELECTOR = `[${REVEAL_ATTRIBUTE}="${REVEAL_VALUE}"]`;
const REVEAL_CLASS = 'reveal-visible';
const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';
const OBSERVER_THRESHOLD = 0.15;
const OBSERVER_MARGIN = '0px 0px -10% 0px';

export function RevealOnScrollController() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR);
    if (!targets.length) return;

    let reduceMotion = false;
    try {
      reduceMotion = window.matchMedia(REDUCE_QUERY).matches;
    } catch {
      reduceMotion = false;
    }

    const reveal = (element: Element) => {
      element.classList.add(REVEAL_CLASS);
      element.removeAttribute(REVEAL_ATTRIBUTE);
    };

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver((entries, observerInstance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observerInstance.unobserve(entry.target);
      });
    }, { threshold: OBSERVER_THRESHOLD, rootMargin: OBSERVER_MARGIN });

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, []);

  return null;
}
