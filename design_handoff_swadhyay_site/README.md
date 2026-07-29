# Handoff: Swadhyay Coaching Website

## Overview
Marketing + course site for **Swadhyay**, a self-mastery & leadership coaching practice run by Neha (ICF PCC certified). Six pages: Home, About, Series (course catalog), Course detail, Schedule (booking), Pricing. The visual language is **sleek, minimal, editorial** — light Poppins headings, mono eyebrows, a monochrome green/cream palette with a single teal accent, plus **per-series accent theming** (each course series recolors its own UI).

## About the Design Files
The files in `designs/` are **design references authored in HTML** — prototypes showing the intended look and behavior, **not production code to ship**. They use a small in-house template runtime (`support.js`, the `<x-dc>` tag and `{{ }}` holes) purely so the prototypes render and stay editable. **Do not port that runtime.** Recreate these screens in the target codebase's existing environment (React/Vue/Svelte/etc.) using its established components, routing, and styling patterns. If no environment exists yet, pick the most appropriate modern framework (React + your CSS solution of choice) and build there. All copy, colors, type, spacing, and interactions below are authoritative.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and interactions. Recreate the UI pixel-accurately, then swap the placeholder image blocks (see Assets) for real photography.

---

## Design Tokens

### Typography
- **Poppins** — everything structural. Weights used: 300 (large display headings), 400 (body), 500, 600 (nav/links), 700 (buttons, bold labels). Loaded incl. italics 300–500.
- **IBM Plex Mono** — 400/500, ONLY for eyebrows / kickers / small uppercase labels & stat captions. Always `letter-spacing: .08–.2em; text-transform: uppercase`.
- **Caveat** — 700, ONLY the "Swadhyay" wordmark logo.
- Display h1: `font-weight:300; font-size:80px; line-height:1.03; letter-spacing:-.035em`. A highlighted phrase inside is `font-weight:500`.
- Section h2: `font-weight:300; font-size:54px; line-height:1.05; letter-spacing:-.02em`.
- Body: `font-size:18–19px; line-height:1.6; color:#B9C6BC` (on dark) / `#4A4E44` (on light).
- `text-wrap: pretty` on headings.

### Colors
| Role | Hex |
|---|---|
| Cream (light section bg) | `#F4F1E9` |
| Hero gradient | `linear-gradient(165deg,#0F2A21,#0B1F18)` |
| Dark section / trust strip | `#0C241C` |
| Dark card | `#16362E` |
| CTA panel gradient | `radial + linear-gradient(160deg,#123B2F,#0E2A21,#0C2419)` |
| Ink on cream | `#12362B` / `#16362E` / `#24261F` |
| Light on dark | `#F6F2EA` |
| Muted (dark bg) | `#B9C6BC`, `#A9BBB0`, `#94A79A`, `#8FA394` |
| Muted (light bg) | `#4A4E44`, `#6B6E63` |
| Mono-label muted | `#6E8577` |
| **Teal accent (primary CTA)** | `#5FC8B8` |
| Teal soft | `#8FE0D4` |
| Teal deep | `#0E766B`, `#0E9C8A` |
| Selection | `#5FC8B8` bg / `#FFF` text |
| Link default / hover | `#16362E` / `#5FC8B8` |

### Per-series accent theming
Each course series recolors its tab, tags, prices, chips, and value band:
| Series | Accent | Soft | Text-on-light |
|---|---|---|---|
| Youth Series | `#D8A33C` (Home) · `#C1852B` (Series) | `#F4EAD6` | `#8A5E1C` |
| Leadership & Board Series | `#5FC8B8` / `#0E766B` | `#E7F1EC` | `#0E766B` |
| Board Retreat | `#C27B54` (Home) · `#B4653B` (Series) | `#E7B394` / `#F3E6DD` | `#9A5A38` |

### Radius / shadow / motion
- Radius: `999px` pills, `22px` cards, `24–34px` large panels.
- Shadows: cards `0 20px 50px -30px rgba(0,0,0,.6)`; teal glow `0 14px 34px -12px rgba(95,200,184,.6)`.
- Easing: `cubic-bezier(.16,1,.3,1)`; transitions `.35–.45s`. Frost transition `.45s`.
- Keyframes: `rvIn` (entrance, translateY 30px + fade), `floaty`/`floaty2` (±14–16px bob), `breathe` (scale 1→1.08 + opacity), `drift` (slow translate on ambient orbs).

### Responsive breakpoints
- **≤1080px** — swap desktop nav for mobile nav bar.
- **≤920px** — grids collapse to 1 column, section padding → 22px, hero top padding → 132px, h1 → 52px, h2 → 38px, `[data-hide-sm]` elements hidden.

---

## Navigation (all pages)
- **Desktop (two floating pills, fixed top:22px):** left pill = Caveat "Swadhyay" logo; center pill = nav links (Home, About, Schedule, Learning, Pricing) + solid teal **"Book a session"** button. Both pills start transparent and gain a **frosted glass** background (`rgba(15,32,27,.6–.72)`, `backdrop-filter:blur(18–20px) saturate(150–160%)`, subtle border + shadow) once the page scrolls past 12px (`body.nav-scrolled` toggled by a scroll listener).
- **Logo alignment:** the nav lives inside a `max-width:1280px` centered container with `0 72px` gutters; the logo pill is pinned to `left:0` of that container so its left edge lines up with the page content grid (not the raw viewport edge).
- **Mobile (≤1080px):** a single frosted rounded bar (`top/left/right:16px`) with the logo and a teal hamburger button; tapping opens a full-width frosted dropdown of the same links + Book CTA. State: `menuOpen`.

---

## Screens

### 1. Home (`Swadhyay Home.dc.html`)
- **Hero** — centered, `max-width:940px`. Mono eyebrow "A SPACE FOR INNER WORK" (teal) → h1 "Coaching for self-mastery **& elevated leadership**" → subhead → two CTAs (solid teal "Book a session →" + outline "Explore courses") → 3 stats row (700+ coaching hours · PCC ICF certified · 380+ people guided; big number 300-weight, mono caption). Ambient blurred teal orb drifts top-right.
- **Trust strip** — `#0C241C` band; mono "TRUSTED ACROSS" + brand wordmarks (Jagriti Yatra, Global Ethics Coaching, Fortune 500 Leaders, Delhi B-School). Last two `data-hide-sm`.
- **Services accordion** — cream section, interactive 3-tab showcase (state `openService` 0–2) with animated keyword bars.
- **Learning / Courses** — `#0C241C`. Heading "Three curated series, one journey inward". **Series tab group** (flex-wrap pill, `border-radius:26px`): **Youth Series · Leadership & Board Series · Board Retreat**. Active tab fills with that series' accent; below, the series description + a 3-card course grid (`repeat(3,1fr)`, gap 22px). Cards are `<a>` links to Course detail, `#16362E`, radius 22px, striped placeholder header with accent tag pill + big faint number, title (25px/300), desc, footer row "▷ lessons · hrs" + accent-colored price. Section CTA "View full {series} →". State: `activeSeries` (`youth|leadership|board`).
- **Testimonial** — cream, large 38px quote + avatar/name/role.
- **Booking CTA** — dark rounded gradient panel, eyebrow + h2 "Start your journey" + 2 CTAs, ambient blurred orb.
- **Footer** — Caveat logo + tagline, Explore / Learning / Connect link columns, copyright + credential line.

### 2. About (`Swadhyay About.dc.html`)
Neha's bio. Portrait inside a **breathing concentric ring** graphic over a radial teal glow; credential **chips**; a **teal pull-quote**. (The old Journey/timeline section was removed.) Home/CTA/footer links all point to `Swadhyay Schedule.dc.html`.

### 3. Series / Learning (`Swadhyay Series.dc.html`)
- **Hero** — two-col: copy left ("Three series, one journey inward") + a ring graphic right showing "**3** SERIES" with three floating labelled pills (Youth teal-dot, Leadership teal-dot, Board `#E7B394`-dot).
- **Series switcher** — cream section. A **sliding-highlight** pill selector (3 tabs: **Youth Series · Leadership & Board · Board Retreat**). A single absolutely-positioned highlight element translates X and resizes to the active tab (`transform`+`width` transition), and its background swaps to the active series' accent. On small widths the pill row sits in an `overflow-x:auto` wrapper so it scrolls instead of breaking the slider. State: `series`.
- **Series header** — kicker (accent) + title + desc + accent chips ("N courses", "hours", "Self-paced") + placeholder image block.
- **Course grid** — 3 cards (white, radius 22px) linking to Course detail (Board Retreat cards link to Schedule).
- **"Why this series" value band** — dark gradient band themed per series (`band`/`bandSoft` colors) with 3 pillar points.
- **Footer** — same as Home; Learning column lists Youth Series, Leadership & Board Series, Board Retreat, Book a session.

### 4. Course detail (`Swadhyay Course.dc.html`)
Single-course page: curriculum/lessons, a **teal-tinted testimonials band**, and a **dark instructor band** introducing Neha (breaks the light monotony).

### 5. Schedule (`Swadhyay Schedule.dc.html`)
Standalone booking flow. Multi-step: `step` (1–4) → `sessionType` → `selectedDate` → `selectedTime` → `contactDetails`. All site "Book a session" CTAs route here.

### 6. Pricing (`Swadhyay Pricing.dc.html`)
Pricing tiers + an FAQ **accordion** (open-item index/set). Currently single-teal themed.

---

## Course content (all three series)

**Youth Series** — amber. For students & young professionals.
1. *Who Am I?* — START HERE · FREE — 18 lessons · 4.5 hrs — Free
2. *Your Best Interview Is Your Best Self* — MOST POPULAR — 12 lessons · 3 hrs — ₹1,499
3. *Confidence & Clarity* — BEGINNER — 10 lessons · 2.5 hrs — ₹1,299

**Leadership & Board Series** — teal. For managers, founders, working professionals.
1. *Leading From Within* — CORE — 15 lessons · 5 hrs — ₹2,999
2. *The Present Leader* — MOST POPULAR — 14 lessons · 4 hrs — ₹2,499
3. *Difficult Conversations* — ADVANCED — 11 lessons · 3.5 hrs — ₹2,299

**Board Retreat** — clay. Facilitated in-person off-sites for boards & founding teams.
1. *The Annual Board Retreat* — FLAGSHIP — 2 days · On-site — On request
2. *Founders in the Room* — INTENSIVE — 1 day · On-site — On request
3. *Governance & Presence* — ADVANCED — 6 sessions · 12 hrs — On request

---

## Interactions & Behavior
- **Frosted-on-scroll nav** — toggle `nav-scrolled` at `scrollY>12`; `.45s` frost transition.
- **Series tab groups** — Home = flex-wrap pill, active tab background = series accent. Series page = single sliding highlight that translates/resizes to the active button and recolors to the series accent; recompute on select, mount, and resize.
- **Reveal-on-scroll** — elements marked `.rv` animate in via `rvIn`; only enabled once the document timeline is confirmed live (a class `rv-go` is added), otherwise content stays visible (never stranded hidden). Respects `prefers-reduced-motion`.
- **Hover lift** — cards translateY(-8px) on hover, `.45s`.
- **Ambient motion** — `floaty`/`breathe`/`drift` on orbs and ring graphics; light parallax on hero orb.
- **Services accordion / FAQ / booking** — index-driven open state as noted per screen.

## State Management
- `menuOpen` (bool) — mobile nav, every page.
- `activeSeries` / `series` — `youth | leadership | board` — Home & Series.
- `openService` (0–2) — Home services showcase.
- Booking: `step` (1–4), `sessionType`, `selectedDate`, `selectedTime`, `contactDetails` — Schedule.
- FAQ open-item index/set — Pricing.
- No data fetching in the prototype — all content is static; wire to a CMS/API as needed.

## Assets
No real images yet. Every image is a **striped placeholder block** (`repeating-linear-gradient` of two greens) with a small mono caption naming what belongs there (portrait of Neha, course thumbnails, series imagery). Replace with real photography at implementation. Fonts load from Google Fonts (Poppins, IBM Plex Mono, Caveat). No icon library — the few glyphs (▷, →, •) are literal characters.

## Files (in `designs/`)
- `Swadhyay Home.dc.html`, `Swadhyay About.dc.html`, `Swadhyay Series.dc.html`, `Swadhyay Course.dc.html`, `Swadhyay Schedule.dc.html`, `Swadhyay Pricing.dc.html`
- `support.js` — prototype runtime only; **do not port**. Read the template markup and the `class Component` logic block at the bottom of each file for exact copy, data arrays, and per-series accent maps.
