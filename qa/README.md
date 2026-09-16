# Responsive layout regression

The fixture in `layout-audit.html` is a developer tool, kept outside `dist`.
To use it, serve a temporary copy alongside the static site on the same origin.
Do not include it in the normal public release. Choose a page and width for
visual inspection, or start the full matrix. Results appear under Messwerte.

Coverage: 23 HTML entry points plus eight audience/view combinations, at
360, 390, 768 and 1280 CSS pixels, each with explicit light and dark themes.
The same-origin iframe gives each document the measured viewport width.
Hash routes use different query strings so each navigation has a load event.

Checks: horizontal document overflow, unusually narrow text columns,
horizontal text clipping, content outside the viewport, approximate text
contrast, and header/footer/navigation dimensions. Intentional `.sr-only`
labels are visually clipped for accessibility and are not layout failures.
Gradient backgrounds are excluded from the approximate contrast check.
This is not an accessibility certification or exhaustive interaction test.

Supplement automated measurements with screenshots of affected blocks,
footers and result states. The fixture closes onboarding dialogs for the
matrix, so their interaction states require separate checks.

Run focused functional checks from the repository root:

```
node qa/check-handoff.cjs
node qa/pwa.cjs
```

The browser matrix does not emulate native iOS/Android standalone windows,
the soft keyboard, physical safe-area insets, or Safari rendering. Verify
these on real devices when available. Responsive iframe tests do not replace
that device verification.
