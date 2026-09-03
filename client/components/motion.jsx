'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Reveal — viewport-triggered entrance animation (scroll reveal).
 *
 * Behaviour:
 * - Content is server-rendered fully visible and is only hidden once JS
 *   confirms the element sits below the fold, so there is never a flash of
 *   missing content and nothing breaks when JavaScript is unavailable.
 * - Elements already on screen when the page mounts are left untouched.
 * - The reveal fires once per element (no re-running on scroll back/forth).
 * - honours prefers-reduced-motion: nothing is hidden and nothing animates.
 *
 * Usage:
 *   <Reveal delay={120} variant="up">…</Reveal>
 */
export default function Reveal({
  children,
  className = '',
  delay = 0,
  variant = 'up', // 'up' | 'fade' | 'zoom'
  as: Tag = 'div',
  ...rest
}) {
  const ref = useRef(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = el.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;

    // Already on screen (fully or partially) — no reveal needed.
    if (rect.top < viewportH && rect.bottom > 0) return;

    // Below the fold → arm the hidden state, then reveal on first entry.
    setHidden(true);

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          io.disconnect();
          setHidden(false);
        }
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const variantClass = variant === 'fade' ? 'fx-fade' : variant === 'zoom' ? 'fx-zoom' : '';

  return (
    <Tag
      ref={ref}
      className={`fx-reveal ${hidden ? `fx-hide ${variantClass}` : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
