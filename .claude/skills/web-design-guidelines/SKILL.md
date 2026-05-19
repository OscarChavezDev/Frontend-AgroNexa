---
name: web-design-guidelines
description: Apply professional web design guidelines and best practices when building any web interface. Use this skill for ensuring visual hierarchy, consistency, readability, accessibility, responsive design, and overall design quality. Covers typography systems, color theory, grid systems, component design, design tokens, and visual design principles. Essential for any web project that needs to feel polished, professional, and intentional.
---

This skill provides a comprehensive set of web design best practices and guidelines to ensure every web interface is visually cohesive, professional, and user-friendly. Apply these guidelines as a foundation for all design decisions.

## Design System Foundation

### Design Tokens First
Always establish a design token system before writing component styles. Tokens ensure consistency and make future changes trivial.

```css
:root {
  /* Colors — Semantic tokens */
  --color-primary: hsl(220, 90%, 56%);
  --color-primary-hover: hsl(220, 90%, 48%);
  --color-primary-active: hsl(220, 90%, 40%);

  --color-surface: hsl(0, 0%, 100%);
  --color-surface-raised: hsl(210, 20%, 98%);
  --color-surface-overlay: hsl(210, 20%, 96%);

  --color-text-primary: hsl(220, 15%, 10%);
  --color-text-secondary: hsl(220, 10%, 40%);
  --color-text-tertiary: hsl(220, 8%, 60%);
  --color-text-disabled: hsl(220, 6%, 75%);

  --color-border: hsl(220, 12%, 88%);
  --color-border-strong: hsl(220, 12%, 75%);

  --color-success: hsl(142, 72%, 42%);
  --color-warning: hsl(38, 92%, 50%);
  --color-error: hsl(0, 85%, 55%);
  --color-info: hsl(200, 85%, 50%);

  /* Typography */
  --font-display: 'YourDisplayFont', serif;
  --font-body: 'YourBodyFont', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */

  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  /* Spacing — 4pt scale */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.06);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06);
  --shadow-xl: 0 24px 48px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08);

  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-base: 250ms ease-out;
  --transition-slow: 400ms ease-out;

  /* Z-index scale */
  --z-below: -1;
  --z-base: 0;
  --z-raised: 10;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-overlay: 300;
  --z-modal: 400;
  --z-toast: 500;
  --z-tooltip: 600;
}
```

---

## Typography System

### Typographic Hierarchy Rules
1. **One h1 per page** — Always. Never two.
2. **Heading scale** — Each level should be clearly visually distinct from the next
3. **Body at 16px minimum** — Never smaller for reading text on mobile
4. **Line length** — 60–75 characters for body, 35–50 for narrow columns
5. **Line height** — 1.5–1.65 for body, 1.2–1.3 for headings
6. **Font weight hierarchy** — Display: 700–800, H1–H3: 600–700, Body: 400, Label: 500

```css
/* Typography scale — use these classes consistently */
.display { font-size: clamp(2.5rem, 5vw, 4.5rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; }
.heading-1 { font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 700; line-height: 1.15; letter-spacing: -0.015em; }
.heading-2 { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 700; line-height: 1.2; }
.heading-3 { font-size: clamp(1.25rem, 2vw, 1.75rem); font-weight: 600; line-height: 1.3; }
.heading-4 { font-size: 1.25rem; font-weight: 600; line-height: 1.35; }
.body-lg { font-size: 1.125rem; line-height: 1.65; }
.body { font-size: 1rem; line-height: 1.6; }
.body-sm { font-size: 0.875rem; line-height: 1.55; }
.label { font-size: 0.875rem; font-weight: 500; letter-spacing: 0.01em; }
.caption { font-size: 0.75rem; line-height: 1.5; }
.overline { font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
```

### Font Selection Guidelines
- **Pair contrasting personalities** — A geometric sans with a humanist serif, or a slab serif with a minimal sans
- **Avoid default system fonts** for display — they look undesigned
- **Limit to 2 font families** — Display/Heading + Body. Mono if needed.
- **Google Fonts recommendations by mood:**
  - Elegant/Luxury: Cormorant Garamond + Jost, Playfair Display + Lato
  - Modern/Tech: Syne + Inter, DM Sans + DM Serif Display
  - Friendly/Organic: Nunito + Merriweather, Poppins + Lora
  - Editorial/Bold: Bebas Neue + Source Serif 4, Oswald + PT Serif
  - Minimal: Plus Jakarta Sans + Fraunces, Outfit + Newsreader

---

## Color Guidelines

### Color Theory for UI
1. **60-30-10 rule** — 60% neutral/background, 30% secondary, 10% accent/primary
2. **Semantic colors** — Define what each color communicates (primary = action, red = danger)
3. **Contrast ratios** — AA minimum 4.5:1 for normal text, 3:1 for large text and UI components
4. **Avoid** — 4+ competing colors, pure black (#000) text, pure white (#FFF) backgrounds

### Dark Mode Color Guidelines
```css
[data-theme="dark"] {
  --color-surface: hsl(220, 20%, 10%);
  --color-surface-raised: hsl(220, 18%, 14%);
  --color-surface-overlay: hsl(220, 16%, 18%);
  --color-text-primary: hsl(220, 15%, 92%);
  --color-text-secondary: hsl(220, 10%, 65%);
  --color-border: hsl(220, 15%, 22%);
  /* Primary hue stays, adjust lightness for dark contexts */
  --color-primary: hsl(220, 85%, 65%);
}
```

---

## Grid & Layout System

### Responsive Grid
```css
.container {
  width: 100%;
  max-width: 1280px;
  margin-inline: auto;
  padding-inline: clamp(1rem, 5vw, 3rem);
}

.grid {
  display: grid;
  gap: var(--space-6);
}

/* 12-column grid */
.grid-12 {
  grid-template-columns: repeat(12, 1fr);
}

/* Auto-responsive grid */
.grid-auto-sm { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.grid-auto-md { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
.grid-auto-lg { grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); }
```

### Breakpoints
```css
/* Mobile first breakpoints */
/* xs: 0–479px (default, no media query needed) */
@media (min-width: 480px) { /* sm: small phone landscape */ }
@media (min-width: 768px) { /* md: tablet */ }
@media (min-width: 1024px) { /* lg: desktop */ }
@media (min-width: 1280px) { /* xl: wide desktop */ }
@media (min-width: 1536px) { /* 2xl: ultrawide */ }
```

---

## Component Design Principles

### Buttons
```css
/* Base button — always define all interaction states */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  line-height: 1;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
  white-space: nowrap;

  /* Default = primary */
  background: var(--color-primary);
  color: white;
}

.btn:hover { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn:active { background: var(--color-primary-active); transform: translateY(0); }
.btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
```

### Cards
```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base), transform var(--transition-base);
}

.card-interactive:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Forms
```css
/* Always use floating labels or visible labels above the input */
.form-group { display: flex; flex-direction: column; gap: var(--space-2); }
.form-label { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--color-text-secondary); }
.form-input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  line-height: 1.5;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  background: var(--color-surface);
  color: var(--color-text-primary);
}
.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px hsl(from var(--color-primary) h s l / 0.15);
}
.form-error { font-size: var(--text-sm); color: var(--color-error); }
```

---

## Visual Hierarchy Checklist

Every page should have these elements clearly defined:

### Entry Points
- [ ] One clear primary action (CTA) per section
- [ ] Visual path that guides eye from hero → value → CTA
- [ ] F-pattern or Z-pattern reading flow respected

### Spacing Rhythm
- [ ] Consistent section spacing (use multiples of your base unit: 48, 64, 80, 96px)
- [ ] Related items closer together, unrelated items farther apart
- [ ] Generous whitespace around headings and CTAs

### Contrast & Emphasis
- [ ] Primary text ≥4.5:1 contrast ratio
- [ ] Most important element is visually heaviest (size + weight + color)
- [ ] No more than 3 font weights used on a single view

### Consistency
- [ ] All similar elements use same spacing, size, and color
- [ ] Border radius is consistent within a component category
- [ ] Icons are all from same family, same visual weight

---

## Responsive Design Rules

1. **Mobile first always** — Start at 375px, layer up
2. **Touch targets ≥ 44px** on all interactive elements
3. **Font min 16px** on body text to prevent iOS auto-zoom
4. **Test at 320px width** — if it works there, it works everywhere
5. **No horizontal overflow** — use `overflow-x: hidden` on body if needed
6. **Images** — always use `max-width: 100%` and `height: auto`
7. **Flexible spacing** — use `clamp()` or percentage-based padding for sections
8. **Nav patterns** — Hamburger on mobile → horizontal nav on desktop

```css
/* Fluid typography */
.heading-responsive {
  font-size: clamp(1.5rem, 3vw + 0.5rem, 3rem);
}

/* Fluid spacing */
.section-padding {
  padding-block: clamp(3rem, 8vw, 6rem);
}
```

---

## Quality Review Checklist

Before delivering any design or UI code, verify:

**Typography**
- [ ] Font pairing is intentional and contrasting
- [ ] Type scale is consistent throughout
- [ ] No orphaned words in headings
- [ ] Line length is within readable range

**Color**
- [ ] All text passes WCAG AA contrast
- [ ] Color is not the only way to convey information
- [ ] Dark mode is considered and implemented
- [ ] No raw hex values — only tokens

**Layout**
- [ ] Works on 375px (iPhone SE) and 1440px
- [ ] No horizontal scroll on any breakpoint
- [ ] Images don't break layout
- [ ] Content priority is correct on mobile

**Components**
- [ ] All interactive elements have hover/focus/active states
- [ ] All states: default, hover, focus, active, disabled, loading, error
- [ ] Form fields have visible labels (not just placeholders)
- [ ] Error messages appear near the problem

**Polish**
- [ ] Transitions feel smooth and natural
- [ ] Shadows are consistent in style and scale
- [ ] Border radii are consistent
- [ ] Spacing rhythm is consistent throughout
