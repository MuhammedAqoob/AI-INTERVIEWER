'use client';

import { usePathname } from 'next/navigation';

/*
 * Subtle route-change transition (App Router).
 *
 * Keying the wrapper by pathname makes React remount the page subtree on every
 * navigation, which replays the CSS `page-enter` animation (fade + tiny rise,
 * ~0.28s, see globals.css). The AuthProvider/ThemeProvider live ABOVE this
 * wrapper, so auth state and theme never reset between routes and no extra
 * auth.me() request is fired on navigation.
 *
 * The animation is purely visual: the incoming page (including any skeleton
 * loading states) is mounted and rendered immediately — nothing waits on it.
 * prefers-reduced-motion disables it in CSS.
 */
export default function PageTransition({ children }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
