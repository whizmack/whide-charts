# TradingView Drawing Dialog Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Trend Line and Rectangle drawing settings with the supplied TradingView references.

**Architecture:** Keep existing React settings components and behavior. Refine their semantic layout hooks and the single vendor stylesheet, then ship those styles through the existing canonical `style.css` package build.

**Tech Stack:** React 19, TypeScript, plain CSS, Vitest, Vite, OpenCharts vendor package.

**Spec:** `docs/superpowers/specs/2026-10-26-tradingview-drawing-dialog-alignment-design.md`

## Global Constraints

- Preserve all drawing settings and persistence behavior.
- Desktop dialog width is 380 CSS px with 20 px gutters, 112 px label column and 16 px gap.
- Compact control height is 34 px; responsive layout must remain usable below 380 px.
- Do not commit without explicit user instruction.

## Review Focus

- Trend Line line/extend/arrow rows remain aligned and usable.
- Rectangle border/background controls remain aligned at different opacity values.
- Rectangle Text textarea and paired selects use the full available width.
- Long tab labels remain reachable without clipping.
- Narrow viewport keeps footer actions and dialog close control reachable.

### Task 1: Dialog geometry and component hooks

**Files:**
- Modify: `third-party/opencharts/controlled-chart.patch` via pinned vendor clone
- Test: `src/__tests__/drawing-settings-tabs.test.tsx` in the vendor clone

**Interfaces:**
- Consumes: existing `DrawingSettingsDialog`, `StyleTab`, `TextTab`, and settings-control classes.
- Produces: stable family/tab hooks and TradingView-like grid geometry in `settings.css`.

- [x] Add failing component assertions for Trend Line Style, Rectangle Style and Rectangle Text layout hooks.
- [x] Run focused vendor tests and confirm the expected failure.
- [x] Add minimal markup hooks and CSS geometry.
- [x] Run focused vendor tests and vendor typecheck.

### Task 2: Package and production-browser verification

**Files:**
- Modify: `third-party/opencharts/dylanpersonguy-opencharts-0.3.0.tgz`
- Modify: `package-lock.json`
- Modify: `docs/2026-10-26-interface-alignment-verification.md`

**Interfaces:**
- Consumes: Task 1 vendor source and canonical CSS build.
- Produces: reproducible tracked tarball and verified host rendering.

- [x] Regenerate the vendor patch including source and build scripts.
- [x] Build/test/package from a clean pinned clone and refresh lock integrity.
- [x] Run backend, host, vendor, typecheck and build verification.
- [x] Measure dialog/control geometry and interactions in the production browser at desktop and narrow widths.
