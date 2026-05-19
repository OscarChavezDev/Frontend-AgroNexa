---
name: animate
description: Add high-quality, performant animations and motion design to web interfaces. Use this skill when the user asks to animate components, add transitions, create loading states, implement scroll animations, micro-interactions, page transitions, hover effects, or any UI motion. Covers CSS animations, Framer Motion, GSAP, and vanilla JS animation techniques. Ensures animations are accessible, performant, and feel intentional.
---

This skill guides the implementation of high-quality animations and motion design that feel purposeful, polished, and alive — not like afterthoughts bolted on.

## Animation Philosophy

Before implementing any animation, ask:
- **Purpose**: Does this motion communicate something meaningful? (state change, hierarchy, feedback, delight)
- **Timing**: Is the duration right? Too slow feels broken. Too fast feels jarring.
- **Easing**: Does the easing curve feel natural for the context? (spring for interactive, ease-out for entrances, ease-in for exits)
- **Performance**: Will this run at 60fps? Only animate `transform` and `opacity` for GPU-accelerated performance.
- **Accessibility**: Does it respect `prefers-reduced-motion`?

## Core Principles

### Performance First
- **ONLY animate**: `transform` (translate, scale, rotate) and `opacity` — these are GPU-accelerated
- **NEVER animate**: `width`, `height`, `top`, `left`, `margin`, `padding` — these trigger layout reflow
- Use `will-change: transform` sparingly and only when actually needed
- Debounce scroll listeners; use `IntersectionObserver` for scroll-triggered animations

### Timing Guidelines
| Type | Duration | Easing |
|------|----------|--------|
| Micro-interactions (button press, toggle) | 100–150ms | ease-out |
| UI state changes (dropdown, modal open) | 200–300ms | ease-out |
| Page transitions | 300–500ms | ease-in-out |
| Entrance animations | 400–600ms | ease-out |
| Exit animations | 200–300ms | ease-in (faster than enter) |
| Loading / skeleton | Loop 1.5–2s | ease-in-out |

### Easing Reference
```css
/* Entrances — decelerate into final position */
ease-out: cubic-bezier(0, 0, 0.2, 1)

/* Exits — accelerate out of view */
ease-in: cubic-bezier(0.4, 0, 1, 1)

/* State changes — smooth in both directions */
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)

/* Spring-like — overshoots slightly, feels physical */
spring: cubic-bezier(0.34, 1.56, 0.64, 1)

/* Snappy — fast start, soft landing */
snappy: cubic-bezier(0.2, 0, 0, 1)
```

## CSS Animation Patterns

### Staggered Entrance (recommended for lists/grids)
```css
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.item {
  animation: fadeSlideUp 0.5s cubic-bezier(0, 0, 0.2, 1) both;
}

/* Stagger via CSS custom properties or nth-child */
.item:nth-child(1) { animation-delay: 0ms; }
.item:nth-child(2) { animation-delay: 60ms; }
.item:nth-child(3) { animation-delay: 120ms; }
/* Or via JS: element.style.setProperty('--delay', index * 60 + 'ms') */
```

### Scroll-triggered with IntersectionObserver
```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // animate once
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
);

document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
```

```css
[data-animate] {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

[data-animate].is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Hover Micro-interactions
```css
.button {
  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.button:active {
  transform: translateY(0px) scale(0.98);
  transition-duration: 0.08s;
}
```

### Skeleton Loading
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    hsl(0 0% 90%) 25%,
    hsl(0 0% 96%) 50%,
    hsl(0 0% 90%) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}
```

### Smooth Modal / Dialog
```css
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal {
  animation: modalIn 0.25s cubic-bezier(0, 0, 0.2, 1) both;
}

.modal-overlay {
  animation: fadeIn 0.2s ease-out both;
}
```

## Framer Motion (React) Patterns

### Page-level entrance
```jsx
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export function Page({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}
```

### Staggered list
```jsx
const container = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const item = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0, 0, 0.2, 1] } },
};

<motion.ul variants={container} initial="initial" animate="animate">
  {items.map((i) => (
    <motion.li key={i.id} variants={item}>{i.label}</motion.li>
  ))}
</motion.ul>
```

### Layout animations (shared element)
```jsx
<motion.div layoutId="card-{id}" className="card">
  {/* Automatically animates between positions when layout changes */}
</motion.div>
```

## Accessibility

**ALWAYS** include this in every project with animations:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

For Framer Motion:
```jsx
import { useReducedMotion } from 'framer-motion';

function AnimatedComponent() {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      animate={{ opacity: 1, y: shouldReduce ? 0 : 0 }}
      initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
    />
  );
}
```

## Anti-patterns to AVOID

- ❌ Animating `width`, `height`, `top`, `left` — use `transform` instead
- ❌ Infinite decorative animations with no purpose — they fatigue users
- ❌ Animations that block interaction or input
- ❌ Same duration for all animations (creates robotic feel)
- ❌ Linear easing for UI — use curves that feel physical
- ❌ No exit animation (abrupt disappearance)
- ❌ Forgetting `prefers-reduced-motion`
- ❌ Triggering layout reflow inside animation loops
- ❌ Using `setTimeout` for sequencing — use `animation-delay` or `staggerChildren`

## Choosing the Right Tool

| Scenario | Tool |
|----------|------|
| Simple hover / state transitions | CSS transitions |
| Entrance/exit keyframe animations | CSS @keyframes |
| Scroll-triggered reveals | CSS + IntersectionObserver |
| Complex sequences, React | Framer Motion |
| Canvas / WebGL / particles | GSAP or Three.js |
| SVG path animations | GSAP DrawSVGPlugin or CSS |
| Spring physics | Framer Motion spring or Popmotion |
