# 🇸🇾 SyriaGuide — Premium Brand & Design System

> Built with a high-fidelity visual aesthetic inspired by **WithLocals**, structured around clean **Vercel Web Interface Guidelines**.

This repository contains the design system tokens, CSS styles, and component documentation for **SyriaGuide**, a tourism marketplace matching travelers with local Syrian university student guides.

---

## 🎨 1. Evolved Visual Vibe (WithLocals & Syrian Heritage)

We analyzed `withlocals.com` to capture its warm, humanist, and personal nature. The SyriaGuide design system incorporates those traits and refines them using Syrian cultural references:

1. **Vibrant Accents**: WithLocals uses `#fb722c` (Coral Orange). SyriaGuide adopts **Syrian Amber (`#FF5E3A`)**, a bright pomegranate orange that acts as the primary action token.
2. **Structural Stability**: We introduced **Damascus Blue (`#1A365D`)**, a deep indigo cobalt shade inspired by Damascus mosaic tiles, which anchors headings and trust blocks.
3. **Approachability**: Buttons are pill-shaped (`9999px` radius) with micro-scale animations (`translateY(-2px)`) on hover and smooth shadows.
4. **Organic Containers**: Profile cards feature a generous `20px` border-radius (`--radius-lg`) with soft, low-intensity elevation drop shadows.

---

## 💎 2. Design Tokens (CSS Custom Properties)

Defined on `:root` inside `styles.css`:

```css
/* Color Tokens */
--brand-coral: #FF5E3A;          /* Syrian Amber (Primary CTA) */
--brand-indigo: #1A365D;         /* Damascus Blue (Headings / Nav) */
--brand-sand: #DFB26C;           /* Desert Gold (Accent / Review Stars) */
--neutral-dark: #1E1E24;         /* Charcoal Black (Text primary) */
--neutral-light: #FBF9F6;        /* Limestone Cream (Warm BG) */

/* Border Radius Tokens */
--radius-lg: 20px;               /* Card containers */
--radius-md: 14px;               /* Form controls */
--radius-pill: 9999px;           /* Buttons & status pills */

/* Elevation Shadows */
--shadow-sm: 0 2px 8px rgba(30, 30, 36, 0.04);
--shadow-md: 0 8px 24px rgba(30, 30, 36, 0.06);
--shadow-lg: 0 16px 40px rgba(30, 30, 36, 0.1);
```

---

## 🚀 3. Web Interface Guidelines Compliance (Vercel Audited)

Following the newly installed **`web-design-guidelines`** skill, the design system implements critical compliance rules:

### Accessibility
- **Semantic HTML first**: The components avoid generic `div` onClick wrappers. Primary buttons use `<button>`, and destination routes use anchor links `<a>`.
- **Contrast Ratios**: Body text on Limestone background maintains a contract ratio greater than **7:1**, exceeding WCAG AAA standards.
- **RTL Script Support**: Integrates `Noto Sans Arabic` with line-height ratios that adapt gracefully when reading direction flips to Right-to-Left (RTL).

### Focus States
- Interactive buttons and inputs replace default browser focus rings with custom `--focus-ring` (a soft amber outline overlay).

### Loading States
- Long-running transaction buttons (like *Processing...* and *Saving...*) feature inline CSS loading spinners and end with horizontal ellipses (`…`) in accordance with the guidelines.

---

## 🖥️ 4. How to Preview

To inspect the interactive playground, color swatches, buttons, form states, and guide profile cards, open `index.html` in your browser:

- Local Preview Path: **[index.html](file:///home/mohammadibrahim/syria-guide-design-system/index.html)**
- CSS Stylesheet: **[styles.css](file:///home/mohammadibrahim/syria-guide-design-system/styles.css)**
