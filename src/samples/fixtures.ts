export const SAMPLE_IAB2B_DESIGN_SYSTEM = `# Design System Inspired by ia-b2b.fr

> Auto-extracted from \`https://ia-b2b.fr/\` on 2026-08-19

## 1. Visual Theme & Atmosphere

High-contrast dark mode with vivid accents — feels modern, technical, and focused.

The hero section leads with "Au-delà de l'automatisation. L'IA comme moteur de votre stratégie B2B." followed by "ia-b2b.fr accompagne les PME et ETI françaises de l'audit de potentiel à l'intégration IA opérationnelle".

**Key Characteristics:**
- Bricolage Grotesque as the heading font (custom web font loaded via @font-face)
- Inter as the body font for all running text
- Heading weight 800, letter-spacing -1.44px
- Dark background (#0b0f0c) as the primary canvas
- Primary accent \`#10b981\` used for CTAs and brand highlights
- 6 shadow level(s) detected — tinted shadows
- Rounded corners (24px+) creating a friendly, approachable feel
- Tags: dark, rounded, colorful, bold-typography, sans-serif

## 2. Color Palette & Roles

### Primary
- **Primary Accent** (\`#10b981\`) · \`--color-primary\`: Brand color, CTA backgrounds, link text, interactive highlights.
- **Secondary Accent** (\`#1d4ed8\`) · \`--color-secondary\`: Secondary brand, hover states, complementary highlights.
- **Background** (\`#0b0f0c\`) · \`--color-bg\`: Page background, primary canvas.

### Text
- **Text Primary** (\`#cbd5e1\`) · \`--color-text\`: Headings and body text.
- **Text Secondary** (\`#94a3b8\`) · \`--color-text-secondary\`: Muted text, captions, placeholders.

### Borders & Surfaces
- **Border** (\`#0c140f\`) · \`--color-border\`: Dividers, outlines, input borders.

### Full Extracted Palette

| # | Hex | CSS Variable | Role | Area | Contrast |
|---|---|---|---|---|---|
| 1 | \`#ffffff\` | \`--palette-1\` | button | large | text-dark |
| 2 | \`#0b0f0c\` | \`--palette-2\` | block | large | text-light |
| 3 | \`#0e3a2a\` | \`--palette-3\` | section | large | text-light |
| 4 | \`#0b3550\` | \`--palette-4\` | section | large | text-light |
| 5 | \`#10b981\` | \`--palette-5\` | button | large | text-dark |
| 6 | \`#0c6e4e\` | \`--palette-6\` | button | medium | text-light |
| 7 | \`#10a34a\` | \`--palette-7\` | button | medium | text-light |
| 8 | \`#1d4ed8\` | \`--palette-8\` | button | small | text-light |
| 9 | \`#34d399\` | \`--palette-9\` | text-accent | small | text-dark |
| 10 | \`#94a3b8\` | \`--palette-10\` | text-accent | small | text-dark |
| 11 | \`#6ee7b7\` | \`--palette-11\` | text-accent | small | text-dark |
| 12 | \`#cbe9d8\` | \`--palette-12\` | text-accent | small | text-dark |
| 13 | \`#d1fae5\` | \`--palette-13\` | text-accent | small | text-dark |

## 3. Typography Rules

- **Heading Font:** \`Bricolage Grotesque\` (web font)
- **Body Font:** \`Inter\` (web font)

### Type Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| H1 | Bricolage Grotesque | 72px | 800 | 72px | -1.44px |
| H2 | Bricolage Grotesque | 48px | 700 | 48px | -0.96px |
| H3 | Bricolage Grotesque | 20px | 600 | 28px | -0.4px |
| Body | Inter | 18px | 400 | 28px | normal |
| Small | Inter | 14px | 600 | 20px | normal |

### Type Scale

| Token | Size | Suggested Usage |
|---|---|---|
| Display | \`176px\` | headings |
| H1 | \`80px\` | headings |
| H2 | \`72px\` | headings |
| H3 | \`48px\` | headings |
| H4 | \`32px\` | headings |
| Body L | \`30px\` | body / supporting text |
| Body | \`28.8px\` | body / supporting text |
| Small | \`24px\` | body / supporting text |
| XS | \`20px\` | body / supporting text |
| Caption | \`18px\` | body / supporting text |

## 4. Component Stylings

### Primary Button

\`\`\`css
.btn-primary {
  background: #1d4ed8;
  color: #ffffff;
  border-radius: 0px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
\`\`\`

### Ghost Button

\`\`\`css
.btn-ghost {
  background: transparent;
  color: #edede8;
  border-radius: 0px;
  padding: 0px 0px;
  font-size: 11.52px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
\`\`\`

### Pill Button

\`\`\`css
.btn-pill {
  background: #0c6e4e;
  color: #ffffff;
  border-radius: 9999px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
\`\`\`

### Pill Button 2

\`\`\`css
.btn-pill-2 {
  background: #10a34a;
  color: #edede8;
  border-radius: 9999px;
  padding: 12.8px 22.4px;
  font-size: 16px;
  font-weight: 600;
  border: 1px solid rgba(52, 211, 153, 0.5);
  cursor: pointer;
}
\`\`\`

### Ghost Button 2

\`\`\`css
.btn-ghost-2 {
  background: transparent;
  color: #cbd5e1;
  border-radius: 0px;
  padding: 12.8px 16.8px;
  font-size: 16px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
\`\`\`

### Filled Button

\`\`\`css
.btn-filled {
  background: #0c6e4e;
  color: #ffffff;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
\`\`\`

### Card

\`\`\`css
.card {
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
}
\`\`\`

## 5. Layout Principles

- **Base spacing unit:** \`22.4px\` — use multiples (44.8px, 67.19999999999999px, 89.6px, etc.)

### Spacing Scale (extracted from real elements)

| Token | Value | Role |
|---|---|---|
| spacing-1 | \`22.4px\` | element |
| spacing-2 | \`28px\` | card |
| spacing-3 | \`10px\` | element |
| spacing-4 | \`12.8px\` | element |
| spacing-5 | \`8px\` | element |
| spacing-6 | \`24px\` | card |
| spacing-7 | \`5.6px\` | element |
| spacing-8 | \`3.52px\` | element |

### Border Radius Scale

| Token | Value | Element |
|---|---|---|
| radius-card | \`24px\` | card |
| radius-button | \`8px\` | button |
| radius-button | \`14px\` | button |
| radius-card-sm | \`16px\` | card |
| radius-card-md | \`22px\` | card |
| radius-card-lg | \`50px\` | card |

## 6. Depth & Elevation

| Level | Shadow | Usage |
|---|---|---|
| Low | \`rgb(255, 255, 255) 0px 0px 0px 0px, rgba(255, 255, 255, 0.1) 0px 0px 0px 1px, rgba(0, 0, 0, 0.8) 0px 10px 30px -22px\` | Cards, subtle elevation |
| Deep | \`rgb(0, 0, 0) 0px 10px 30px -22px\` | Hero sections, deep layers |
| Subtle Glow | \`rgba(52, 211, 153, 0.3) 0px 0px 0px 1px, rgba(0, 0, 0, 0.8) 0px 10px 30px -22px\` | Cards, subtle elevation |
| Tinted Ring | \`rgba(52, 211, 153, 0.12) 0px 0px 0px 4px\` | Cards, subtle elevation |

## 7. Do's and Don'ts

### Do
- Use \`#0b0f0c\` as the primary background color
- Use \`Bricolage Grotesque\` for all headings and \`Inter\` for body text
- Use \`#10b981\` as the single dominant accent/CTA color
- Maintain \`22.4px\` as the base spacing unit — all gaps should be multiples
- Keep the overall feel dark — use dark surfaces throughout
- Use rounded corners (\`24px\`+) consistently for all interactive elements
- Make headlines large and bold — typography is the hero element
- Embrace bold color combinations — playful energy is the point
- Apply the shadow system for elevation — use the extracted shadow values
- Use weight 800 for headings to match the brand's typographic voice

### Don't
- Don't use colors outside the extracted palette without justification
- Don't substitute Bricolage Grotesque/Inter with generic alternatives
- Don't use irregular spacing — stick to 22.4px grid
- Don't introduce bright white surfaces — they break the dark palette
- Don't use sharp corners — they feel hostile in this rounded design language
- Don't use pure black (#000000) for text — use \`#cbd5e1\` instead
- Don't add decorative elements not present in the original design — no badges, ribbons, banners, or ornaments unless the source site uses them
- Don't invent UI patterns the source site doesn't have — if the original has no NEW badge, don't add one just because a red is in the palette

## 8. Responsive Behavior

| Breakpoint | Width | Notes |
|---|---|---|
| Mobile | < 640px | Single column, stack sections, reduce font sizes ~80% |
| Tablet | 640–1024px | 2-column where appropriate, maintain spacing ratios |
| Desktop | 1024–1440px | Full layout as designed |
| Wide | > 1440px | Max-width container, center content |

- Touch targets: minimum 44×44px on mobile
- Maintain 22.4px base unit across breakpoints — only scale multipliers
`;

export const SAMPLE_APEX_DESIGN_SYSTEM = `# Apex UI Design System

A modern, high-contrast, accessibility-first design system built for scalable cloud applications and developer tools.

## Philosophy & Principles

* **Clarity over cleverness**: High contrast, unambiguous states, and clear affordances.
* **Density with breathing room**: Information-dense dashboards with consistent 4px rhythm.
* **Universal Accessibility**: WCAG 2.1 AAA target contrast ratios and standard 44px tap targets.
* **Predictable Motion**: Subtle, physics-based transitions under 200ms.

## Colors

### Brand & Accents
| Name | HEX | RGB | Role |
| :--- | :--- | :--- | :--- |
| Primary 600 | #4f46e5 | rgb(79, 70, 229) | Primary brand and primary action buttons |
| Primary 500 | #6366f1 | rgb(99, 102, 241) | Interactive hover states and active links |
| Primary 700 | #4338ca | rgb(67, 56, 202) | Active pressed state for brand elements |
| Secondary | #0ea5e9 | rgb(14, 165, 233) | Supporting highlights and badges |
| Accent Purple | #8b5cf6 | rgb(139, 92, 246) | Creative accents and feature highlights |

### Surface & Backgrounds
| Name | HEX | RGB | Role |
| :--- | :--- | :--- | :--- |
| App Background | #090d16 | rgb(9, 13, 22) | Root viewport background |
| Surface Card | #111827 | rgb(17, 24, 39) | Card and container elevation level 1 |
| Surface Elevate | #1f2937 | rgb(31, 41, 55) | Floating popovers and dropdown menus |
| Border Subtle | #374151 | rgb(55, 65, 81) | Default container strokes and dividers |

### Functional & Semantic
| Name | HEX | RGB | Role |
| :--- | :--- | :--- | :--- |
| Success Green | #10b981 | rgb(16, 185, 129) | Positive statuses, completed checks, validation |
| Warning Amber | #f59e0b | rgb(245, 158, 11) | Non-blocking alerts and rate limit warnings |
| Danger Red | #ef4444 | rgb(239, 68, 68) | Destructive actions and critical validation errors |
| Info Blue | #3b82f6 | rgb(59, 130, 246) | Informational tooltips and system notifications |

## Typography

Global font family: \`Inter, -apple-system, sans-serif\`

| Level | Size | Weight | Line Height | Role |
| :--- | :--- | :--- | :--- | :--- |
| Display | 48px | 800 | 56px | Marketing hero headlines |
| H1 | 36px | 700 | 44px | Main page titles |
| H2 | 28px | 600 | 36px | Section headers |
| H3 | 20px | 600 | 28px | Card and panel headers |
| Body Large | 18px | 400 | 28px | Lead paragraphs and intro text |
| Body | 16px | 400 | 24px | Default paragraph and form label text |
| Small | 14px | 500 | 20px | Captions, table cells, metadata |
| Micro | 12px | 500 | 16px | Badges, tags, and small indicators |

## Spacing & Layout

The spacing scale is strictly based on a 4px geometric grid.

* **space-1**: 4px (tight icon gaps)
* **space-2**: 8px (component inline padding)
* **space-3**: 12px (card compact padding)
* **space-4**: 16px (standard component padding)
* **space-6**: 24px (card and panel separation)
* **space-8**: 32px (section vertical rhythm)
* **space-12**: 48px (major page division)
* **space-16**: 64px (hero container padding)

## Border Radius

* **radius-sm**: 4px (small badges, tags, and tooltips)
* **radius-md**: 8px (buttons, inputs, and form controls)
* **radius-lg**: 12px (cards, modals, and container panels)
* **radius-xl**: 16px (large dialogs and floating panels)
* **radius-full**: 9999px (avatar pills and round badges)

## Shadows & Elevation

\`\`\`css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.25);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
\`\`\`

## Breakpoints

* **sm**: 640px (Mobile landscape & large handsets)
* **md**: 768px (Tablets portrait)
* **lg**: 1024px (Tablets landscape & compact laptops)
* **xl**: 1280px (Standard desktop displays)
* **2xl**: 1536px (Ultra-wide monitors & workstations)

## Components

### Button
Interactive element used to trigger actions or navigate.

#### Variants
* **Primary**: Filled with Primary 600, white text for dominant calls to action.
* **Secondary**: Outlined or subtle background for alternative actions.
* **Outline**: 1px border stroke with transparent background.
* **Ghost**: Transparent until hover, used for toolbar actions.
* **Destructive**: Filled with Danger Red for irreversible operations.

#### Sizes
* **sm**: height 32px, text 14px, padding 8px 12px
* **md**: height 40px, text 16px, padding 10px 16px
* **lg**: height 48px, text 18px, padding 12px 24px

#### States
* Default, Hover, Active, Focus Ring, Disabled (opacity 0.5, cursor not-allowed)

### Input
Standard text input component for single-line user input.

#### States
* Default (border subtle, surface card background)
* Focus (primary 500 ring 2px)
* Error (danger red border and alert text)
* Disabled (opacity 0.6)

### Badge
Compact indicator for displaying status, counts, or tags.

#### Variants
* Default (neutral gray)
* Success (green tint)
* Warning (amber tint)
* Destructive (red tint)

## Motion & Transitions

* **duration-fast**: 150ms (micro-interactions, button hover)
* **duration-normal**: 250ms (dropdown open, modal enter)
* **duration-slow**: 400ms (page transition, accordion expand)
* **easing-standard**: cubic-bezier(0.4, 0, 0.2, 1)

## Accessibility Guidelines

* **Contrast Compliance**: Minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text (WCAG AA).
* **Focus States**: High-contrast 2px visible focus rings on all interactive elements. Never remove \`outline: none\` without replacement.
* **Touch Targets**: Minimum tap target area of 44x44px on touch devices.
* **Reduced Motion**: Respect \`prefers-reduced-motion: reduce\` by eliminating animations and using immediate opacity cuts.
`;

export const SAMPLE_MINIMAL_COLORS = `# Chroma Palette System

A compact palette specification containing only color swatches and tokens.

## Brand Colors
* **Brand Primary**: #10b981
* **Brand Secondary**: #1d4ed8
* **Brand Accent**: #34d399

## Surface Colors
* **Background Dark**: #0b0f0c
* **Card Surface**: #111a14
* **Border Color**: #1b2b21

## Status Colors
* **Success**: #10a34a
* **Warning**: #f59e0b
* **Error**: #ef4444
`;

export const SAMPLE_NARRATIVE_GUIDELINES = `# Aurora Visual Identity

Aurora is an ethereal, calm design language inspired by northern lights and deep polar nights.

## Vision and Tone
Aurora emphasizes spacious calm, deep obsidian surfaces, and luminous gradient accents.
Interfaces should feel weightless, clean, and distraction-free.

## Core Visual Rules
- Use obsidian dark (#0b0f0c) for all primary backgrounds to reduce eye strain.
- Highlight interactive focal points with radiant emerald (#10b981) and cobalt blue (#1d4ed8).
- Keep text crisp with high-legibility snow white (#cbd5e1) and muted ice (#94a3b8).
- Use generous spacing between sections (minimum 22.4px).
- Apply smooth 24px rounded corners on cards to maintain an organic, approachable feel.
- Ensure every interactive button has a clear 2px focus ring for full keyboard navigation.
`;

export const SAMPLE_CYBERPUNK_TOKENS = `# Neon Cyberpunk Tokens

CSS design tokens for high-density HUD interfaces and terminal tools.

## Design Tokens

\`\`\`css
:root {
  --color-neon-emerald: #10b981;
  --color-neon-blue: #1d4ed8;
  --color-neon-mint: #34d399;
  --color-hud-bg: #0b0f0c;
  --color-hud-panel: #111a14;
  --color-hud-border: #1b2b21;
  
  --color-primary: var(--color-neon-emerald);
  --color-secondary: var(--color-neon-blue);
  --color-accent: var(--color-neon-mint);
  
  --radius-hud: 24px;
  --radius-sharp: 0px;
  --radius-cut: 8px;
  
  --space-unit-1: 5.6px;
  --space-unit-2: 12.8px;
  --space-unit-4: 22.4px;
  --space-unit-8: 44.8px;
  
  --shadow-neon-emerald: 0 0 15px rgba(16, 185, 129, 0.4);
  --shadow-neon-blue: 0 0 15px rgba(29, 78, 216, 0.4);
  
  --font-hud: "Bricolage Grotesque", sans-serif;
  --font-size-terminal: 14px;
  --font-size-header: 48px;
}
\`\`\`
`;
