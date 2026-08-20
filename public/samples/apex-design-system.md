# Apex UI Design System

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
