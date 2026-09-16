# LANE SWITCH layout audit — 2026-09-16

Scope: `cloudflare-online`, published on laneswitch.online. No changes to `main`.

## Measured coverage

- Baseline: 23 HTML entry points × 4 widths × 2 themes = 184 records.
- Regression: the same 23 entry points plus all four app views for both
  audiences × 4 widths × 2 themes = 248 records.
- Widths: 360, 390, 768 and 1280 CSS pixels; iframe height 850 pixels.
- Explicit light and dark themes. Initial page states, with onboarding
  dialogs dismissed for the matrix.

Baseline findings affected six pages: learner information, school information,
Emre partner page, emergency center, accident helper and templates. Issues were
fixed in shared content rules rather than by hiding horizontal overflow.

## Corrections

- Removed the obsolete 70px icon column from emergency case headings.
- Contact panels and role cards now respond to available content width,
  including the desktop sidebar, using a named inline-size container.
- Narrow template/source/partner/step/form grids stack below 650px of content.
- Long text wraps within its card.
- Removed the fixed 145px column from the school quiz highlight.
- Calculator result actions stack below 420px.
- All 23 entry points use viewport-fit=cover; mobile navigation and page
  padding account for system safe areas. Game toolbar handles the top inset.
- Installation and offline pages honor the saved light/dark preference.
  Offline cache version bumped for the revised offline document.

## Evidence and interpretation

`layout-before.json` retains the baseline. `layout-after.json` retains the full
248-record regression before the final focused follow-up. The regression has
two remaining real flags: the school information quiz highlight at 768px in
both themes. Its source was a 5px horizontal overflow from the fixed label
column. This was subsequently corrected. `layout-focused.json` confirms the
768px school page passes in both themes and also records the 360px calculator
result in both themes after the final action-button correction. All four
focused measurements have no overflow, narrow text, clipping, out-of-bounds
content or approximate contrast flags. The calculator buttons were also
visually confirmed to stack with fully readable labels.

Sixteen clipped `.sr-only` search labels are intentional accessibility labels,
not visible clipping defects. Their raw flags remain in the results for
transparency. Approximate contrast checks exclude gradients and are not a
complete WCAG audit.

Additional direct browser checks: mobile check result in light and dark at
360px, desktop check result and complete transfer of 12 answers plus six
section scores into contact; calculator navigation through four steps and
result at desktop and 360px; emergency center heading and footer at 768px.
No test email was sent. All local HTML href/src references resolve.

Focused functional tests `check-handoff.cjs` and `pwa.cjs` pass. These check
report serialization/one-time handoff and offline/cache/install-state behavior,
respectively; they are not substitutes for native phone installation tests.

## Limits

No physical Android/iPhone or Safari test was available. Native standalone
windows, keyboard overlap, rotation, actual safe-area insets, all game states,
all dialogs and every possible user entry were not exhaustively exercised.
The matrix and visual samples establish responsive coverage, not a guarantee
that every browser and state is defect-free.
