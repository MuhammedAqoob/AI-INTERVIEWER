# AI-INTERVIEWER Design System & UI Guide

This guide details the complete design system, visual architecture, component specifications, dark-mode implementation strategy, and WCAG AA accessibility standards implemented across the **AI-INTERVIEWER** application.

---

## 🎨 Color Palette & Theme Tokens

The application uses an extended Tailwind system (`client/tailwind.config.js`) supporting standard light mode and class-based dark mode (`darkMode: 'class'`).

### 1. Brand & Core Colors
| Color Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| `brand-500` | `#3b82f6` | Primary action focus rings, active indicators |
| `brand-600` | `#2563eb` | Primary buttons, active badges (Light mode) |
| `brand-400` | `#60a5fa` | Primary buttons & highlights (Dark mode) |
| `slate-50` | `#f8fafc` | Main page background (Light mode) |
| `slate-900` | `#0f172a` | Main card background & text (Dark mode) |
| `slate-950` | `#020617` | Main page background (Dark mode) |

### 2. Status & Difficulty Colors
| Difficulty / Type | Light Badge | Dark Badge |
| :--- | :--- | :--- |
| **Easy** | Emerald 50 (`bg-emerald-50 text-emerald-700`) | Emerald 950 (`dark:bg-emerald-950/60 dark:text-emerald-300`) |
| **Medium** | Amber 50 (`bg-amber-50 text-amber-700`) | Amber 950 (`dark:bg-amber-950/60 dark:text-amber-300`) |
| **Hard** | Rose 50 (`bg-rose-50 text-rose-700`) | Rose 950 (`dark:bg-rose-950/60 dark:text-rose-300`) |
| **Technical** | Brand 50 (`bg-brand-50 text-brand-700`) | Brand 950 (`dark:bg-brand-950/60 dark:text-brand-300`) |
| **HR** | Info / Indigo 50 (`bg-indigo-50 text-indigo-700`) | Indigo 950 (`dark:bg-indigo-950/60 dark:text-indigo-300`) |

---

## 📐 Typography & Elevation Scale

### Typographic Hierarchy
- **Page Titles**: `text-3xl font-extrabold tracking-tight` (e.g. Dashboard, History, Leaderboard headers).
- **Section Headers**: `text-xl font-bold tracking-tight` (e.g. Form sections, Card headers).
- **Subheadings**: `text-base font-semibold`.
- **Body Text**: `text-sm leading-relaxed text-slate-600 dark:text-slate-400`.
- **Captions & Meta**: `text-xs text-slate-400 dark:text-slate-500`.

### Radius & Elevation Tokens
- **Container Radii**: `rounded-2xl` for cards, modals, hero banners; `rounded-xl` for buttons, inputs, and badges.
- **Shadows**: `shadow-sm` base cards, `shadow-md` hover states, `shadow-xl` modals and auth containers, `shadow-glow-sm` active selection borders.

---

## 🧩 UI Component Primitives Library (`client/components/ui.jsx`)

All ad-hoc JSX elements across pages have been unified into reusable component primitives:

1. **`Button`**:
   - Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`.
   - Sizes: `sm`, `md`, `lg`.
   - Built-in loading state with `Spinner`, icon slot, keyboard focus ring (`focus-visible:ring-2`), and active press animations (`active:scale-[0.98]`).
2. **`Input` & `Textarea`**:
   - Integrated label, helper text, and inline error message slots with distinct red icon cues.
   - Built-in `aria-invalid` and `aria-describedby` accessibility links.
3. **`Card` System**:
   - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
4. **`Badge` / `TypeBadge` / `DifficultyBadge`**:
   - Semantic tags for `EASY`, `MEDIUM`, `HARD`, `TECHNICAL`, `HR`, `APTITUDE`, `RESUME`.
5. **`Modal` & `DeleteDialog`**:
   - Backdrop blur (`backdrop-blur-sm`), fade-in and scale animation, keyboard escape handler, backdrop dismiss.
6. **`StatCard`**:
   - Clean metrics card with upper caption, extra large numbers, status color customization, and optional SVG icon slot.
7. **`AnalyticsGrid`**:
   - Progress bar indicators for core competencies.

---

## 🌙 Dark-Mode Architecture

- **Strategy**: Tailwind `class` mode enabled via `<html class="dark">`.
- **State Management**: Client `ThemeProvider` (`client/components/ThemeProvider.jsx`) with `useTheme()` hook.
- **Persistence**: Persisted in `localStorage` under key `'theme'`. Automatically detects OS preference (`prefers-color-scheme: dark`) when set to `system`.
- **Toggle UI**: Sun / Moon icon button embedded in `TopNav.jsx`.

---

## 📱 Mobile-First Navigation & Responsiveness

- **Header Bar**: Fixed/Sticky header with `backdrop-blur-md`.
- **Mobile Menu**: Collapses into a hamburger icon on screen sizes `≤640px` (`sm:` breakpoint).
- **Drawer**: Slide-down menu with ARIA `aria-expanded` and `aria-label` attributes.

---

## ♿ Accessibility (WCAG AA) Checklist

- [x] **Focus Outlines**: Every interactive element includes explicit `focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2`.
- [x] **Color Contrast**: Text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text) on both light and dark backgrounds.
- [x] **Form Labels**: Inputs feature programmatic `<label htmlFor="...">` links and fallback ARIA attributes.
- [x] **Modal Dialogs**: Modals declare `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
- [x] **Keyboard Navigation**: File upload input in Interview Setup features keyboard activation (`Enter` / `Space`).

---

## 🚀 Verification & Build

Run the Next.js production build command to confirm compile validity:
```bash
cd client
npm run build
```
