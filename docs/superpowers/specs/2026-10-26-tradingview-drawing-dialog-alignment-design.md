# TradingView drawing dialog alignment design

## Goal

Match the supplied TradingView Trend Line and Rectangle settings dialogs in
proportion, alignment and density while preserving every existing setting and
keyboard interaction.

## Approved direction

Use the native OpenCharts drawing dialog as the only implementation surface.
At desktop density the dialog is 380 CSS px wide, uses 20 px content gutters,
a fixed 112 px label column, a 16 px column gap and a flexible control column.
Header, tabs, body and footer share the same inline edges. Controls use a 34 px
compact height, 6 px radius and vertically centered text/icons. Style rows keep
labels left and complete control clusters right. Text-tab controls use the full
content width with two equal alignment selects below the textarea.

The dialog remains responsive: below 380 px it fits the viewport with 12 px
outer clearance and collapses field rows to one column only when the two-column
grid no longer fits. No drawing behavior, persistence, data geometry or setting
semantics change.

## Verification

Cover Trend Line Style, Rectangle Style and Rectangle Text structure with
component regressions. Rebuild the pinned vendor package from a clean clone,
then measure the rendered dialog and control centers in the production browser
at desktop and narrow widths. Verify keyboard tabs, focus, Cancel and OK.
