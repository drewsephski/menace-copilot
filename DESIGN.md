---
name: Menace Agent
description: Conversation autocue — matte black hood, cream type, red tally, hairline bezels.
colors:
  hood: "#0b0b0b"
  surface: "#121212"
  elevated: "#1a1a1a"
  hover: "#222222"
  cream: "#f7f7f2"
  secondary: "#a8a89e"
  muted: "#5c5c56"
  border: "rgba(247, 247, 242, 0.08)"
  chrome: "rgba(247, 247, 242, 0.14)"
  tally: "#c41e3a"
  tally-hover: "#a81830"
  tally-dim: "#3a151c"
  tally-glow: "rgba(196, 30, 58, 0.35)"
  success: "#5aab6e"
  warning: "#d4a017"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.1em"
  prompter:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "-0.01em"
  mono:
    fontFamily: "'SF Mono', Menlo, Monaco, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  hood: "12px"
  chrome: "3px"
  pill: "100px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.tally}"
    textColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.tally-hover}"
    textColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    padding: "8px"
  button-header:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    rounded: "{rounded.chrome}"
    padding: "6px 12px"
  plate:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: "16px"
  input:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: "12px"
  input-focus:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: "12px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  nav-item-active:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.cream}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  chip:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
    typography: "{typography.mono}"
  input-bar:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    height: "32px"
    padding: "0 16px"
  tally-lit:
    backgroundColor: "{colors.tally}"
    size: "10px"
    rounded: "50%"
---

# Design System: Menace Agent

## Overview

**Creative North Star: "Conversation Autocue"**

Menace Agent is a newsroom teleprompter in a Mac window: a matte black hood, cream-white copy, and a single red camera tally. Setup is a centered board of hairline plates (session type, context, permissions). Once the session starts, the app collapses into a compact always-on-top strip whose job is ready-to-speak lines — not a copilot dashboard.

The material is opaque metal and matte plastic, not glass. Edges are cream at 8–14% opacity — a bezel that catches light, not a drawn box. Type is the Mac’s own sans, set like a prompter: one large instruction on the hood, then 20px medium lines you can read aloud while the call stays in front. Personality stays dry and on-air, not corporate and not neon-AI.

**Key Characteristics:**
- Matte hood black with cream type and a scarce red tally
- Hairline cream bezels; no glass, blur, or gradient-mesh chrome
- System sans as the only display/body face; mono only for keys and counters
- Window rounded as a hood (12px); plates stay tight (4px)
- Depth from tonal steps and the tally lamp, not drop shadows or hard outlines

## Colors

A four-ink board: hood, cream, hairline bezel, red tally. Status greens and ambers exist for notes, not as brand.

### Primary
- **Tally Red**: The on-air lamp and the only filled go-action (Continue, Save key, Get on air). Hover darkens to **Tally Hover**. Unlit lamps sit on **Tally Dim**. Selection highlight uses tally on cream type.
- **Tally Glow**: Soft lamp bloom around a lit 8–10px tally dot only. Not a card shadow, not a button glow.

### Neutral
- **Hood Black**: App field, onboarding hood, live response bed. The default canvas.
- **Surface Plate**: Sidebar, live bar, edge plates, settings cards — one step up from the hood.
- **Elevated**: Inputs, active nav, code chips, the live text bar. A plate sitting on a plate.
- **Hover**: Nav hover wash and selected screen-option.
- **Cream**: All primary type, primary-button type, selection type.
- **Secondary**: Body supporting copy, idle nav, plate body when it is not the headline.
- **Muted**: Tracked labels (KEY, WHISPER, STANDBY, ON AIR), hints, placeholders, skip/back.
- **Hairline**: Default plate edge — cream at 8% (`rgba(247, 247, 242, 0.08)`). Window rim, sidebar divider, inputs, cards.
- **Chrome**: Slightly stronger bezel at 14% for scrollbar thumbs and unlit step dots. Never a solid gray stroke.

### Named Rules
**The Tally Rule.** Red is the lamp and the go button. It does not fill sidebars, cards, or large fields. If a screen has more than one solid red rectangle, the lamp has been overused.

**The Four-Ink Rule.** Hood, cream, hairline, tally. Do not add a fifth brand hue. Success and warning stay in status notes.

## Typography

**Display Font:** SF Pro Text / -apple-system (with system-ui, sans-serif)
**Body Font:** Same stack — one prompter face
**Label/Mono Font:** SF Mono / Menlo / Monaco / Consolas — keys, counters, Analyze, click-through

**Character:** A working teleprompter, not a marketing pairing. Hierarchy is size, weight, and tracking. No second display family.

### Hierarchy
- **Display** (600, 32px, 1.15, -0.02em): Onboarding slide titles — one large cream line of instruction on the hood.
- **Headline** (600, 22px): Setup and settings page titles.
- **Title** (600, 14px, -0.01em): Sidebar wordmark, section titles, header title.
- **Body** (400, 14px, 1.55): Default UI copy. Supporting slide text drops to 13px on secondary.
- **Prompter** (500, 20px, 1.45, -0.01em): Live ready-to-speak answers. The session’s only large type.
- **Label** (600, 11px, 0.1em, uppercase): KEY, WHISPER, STANDBY, ON AIR, field names. Tally status uses 0.14em.
- **Mono** (400, 11px): Keycaps, response counters, live elapsed time.

### Named Rules
**The Prompter Face Rule.** One system sans for everything the user reads aloud. Do not introduce a display serif, a geometric AI sans, or a second UI family. Mono is for machine text only.

**The Ready-to-Speak Rule.** Live answers are 20px medium cream on hood. Do not drop session copy to body size to “fit more dashboard.”

## Layout

Two densities, one hood.

**Setup (normal window).** Centered column: onboarding `min(440px, 100% - 64px)`; main start form `420px`; settings wrap `1160px` with `24px` page padding (`16px` under 640px). Sidebar is a `200px` surface plate with `8px` nav inset; content is hood. Top drag bar is `38px` transparent over the chrome.

**Live (compact overlay).** Sidebar gone. A `36px` live bar (ON AIR + status) over a full-bleed prompter column with `16px 24px` response padding and a `32px` pill input strip.

Rhythm is the spacing scale (`4 / 8 / 16 / 24 / 40`). Onboarding slides stack `16px` gaps with `40px 24px` slide padding. Edge plates are a two-column grid with an `8px` gutter.

The Electron window itself is the hood: `12px` outer radius, `1px` cream hairline rim, inner bezel inset `10px` at `8px`. Content does not sit in a floating glass card inside a bigger page.

## Elevation & Depth

Flat plates on a darker hood. No rest-state drop shadows. Layers are the four neutrals (hood → surface → elevated → hover) plus a 1px cream hairline.

The only glow is the tally lamp: `0 0 12px` (onboarding) / `0 0 10px` (ON AIR) using tally-glow. Onboarding’s hood may carry a faint radial wash of tally at ~8% opacity — a light leak in the booth, not a card effect. Focus is a `2px` tally outline (`2px` offset) on the document, or a 1px tally ring on form controls. Inputs never use a colored box-shadow for decoration.

### Named Rules
**The Hairline Bezel Rule.** Opaque fill + cream-at-8% 1px edge. No solid gray chrome, no `backdrop-filter`, no frosted fill, no multi-stop brand gradients. If it looks like a drawn box or like glass, it is wrong.

**The Lamp-Only Glow Rule.** `box-shadow` exists for the tally dot. Not for buttons, plates, or nav.

## Shapes

The **hood** is the outer window: 12px corners, 11px on the inner chrome shell. **Plates** (primary buttons, inputs, edge cards, settings surfaces) are 4px. **Nav items** and config sections use 8px. **Overlay chrome** buttons and keycaps in the session header sit at 3px. **Live talkback** (text bar, Analyze) is fully pill (`100px` at 32px height). Status pills elsewhere may use a full capsule.

Tally lamps and traffic-light window controls are circles. Unlit step dots are 6px cream-14% circles; the active dot fills tally.

Borders are 1px hairlines, never 2px+ “strokes for style.” Cream at 8% on plates; 14% only for scrollbar thumbs and unlit dots.

## Components

### Buttons
- **Shape:** Tight plate (4px). Overlay header actions use 3px.
- **Primary:** Tally fill, no border, cream label, 13px semibold, `12px 16px`, full width in onboarding. Hover → tally-hover with cream type still. Disabled → 45% opacity. Native appearance is stripped so macOS never paints a white hover.
- **Ghost / Back / Skip:** No border, muted type, `8px` pad. Hover → secondary.
- **Header:** Transparent, 1px hairline, cream, `6px 12px`. Hover → hover wash. Icon-only uses `6px` pad and 18px glyphs.
- **Focus:** Document `:focus-visible` tally outline. Do not restyle primary into a glow.

### Chips
- **Style:** Elevated fill, secondary type, 2px 8px, 4px, 11px mono — keycaps and machine tags.
- **Live pills:** Hairline + muted type, full capsule, 11px — session metadata, not filters.

### Cards / Containers
- **Corner Style:** 4px plates (settings `.surface`, onboarding plates and checklists). Config accordions may use 8px.
- **Background:** Surface on hood. Never transparent glass.
- **Shadow Strategy:** None at rest. See Elevation.
- **Border:** 1px cream hairline. Never a solid gray or white stroke.
- **Internal Padding:** 16px on settings surfaces; onboarding plates `10px 12px`.

### Inputs / Fields
- **Style:** Elevated fill, 1px hairline, 4px, 13px cream, 12px pad (onboarding) or `10px 12px` / `8px 12px` (settings).
- **Focus:** Border → tally. Settings add `0 0 0 1px` tally. Onboarding key field: border only, no ring. `outline: none` on the control because the border *is* the focus.
- **Error:** Border → tally/danger (same red). Placeholder is muted.
- **Live bar:** Pill, 32px, elevated, hairline; focus-within border → tally. Send/analyze sit as matching 32px pills.

### Navigation
- **Sidebar:** 14px medium, secondary type, 8px 16px, 8px radius, 20px glyphs. Hover: cream on hover wash. Active: cream on elevated. No tally fill in the rail.
- **Live bar:** 10px uppercase tracked ON AIR with an 8px lit tally; muted mono for time and click-through; 14px ghost back.
- **Response pager:** Muted 14px icon buttons; hover cream; disabled 25%.

### Edge Plate (signature)
Two-up KEY / WHISPER (and later status) cells on the hood. Surface fill, 1px cream hairline, 4px, `10px 12px`. Name is label type (uppercase, muted); body is 13px cream. These are hardware labels, not cards with icons.

### Tally / ON AIR (signature)
10px (onboarding) or 8px (live) circle. Unlit: tally-dim with a 1px inset tally ring. Lit: tally fill + lamp glow. Pair with a tracked uppercase word (STANDBY, KEY, PERMISSIONS, CONTEXT, ON AIR). This is camera language, not a marketing eyebrow.

### Prompter (signature)
Live response column: hood bed, cream, 20px / 1.45 / 500. Markdown stays in-family: hairline tables, elevated inline code in mono, surface blockquotes with 4px and a hairline. Links are tally, underlined with 2px offset. User-select is on; this is copy to read, not chrome to click.

## Do's and Don'ts

### Do:
- **Do** set cream type on hood black, and keep the red lamp scarce.
- **Do** edge plates with cream-at-8% hairlines and 4px corners; depth comes from fill steps.
- **Do** use one system-sans stack; set live answers at 20px medium.
- **Do** mark session state with a circular tally + uppercase tracked label (ON AIR, KEY, WHISPER).
- **Do** keep Start / Continue cream-on-tally in every hover and theme state.

### Don't:
- **Don't** build a neon glass AI-copilot: no frosted panels, aurora fills, indigo/violet meshes, or glow under cards.
- **Don't** introduce a display serif, geometric “AI” sans, or a second UI family.
- **Don't** fill large regions with tally red, or use a second accent as brand.
- **Don't** drop-shadow plates or rest buttons on ambient shadows.
- **Don't** paint a white or light hover on a cream-labeled go button.
- **Don't** treat the live overlay like a dashboard; it is a prompter strip.
