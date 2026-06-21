# Fix the pink mobile browser bar

The pink area at the top of the mobile browser (the address/status bar tint) comes from the `theme-color` setting, currently `#ec4899` (pink). We'll change it to the app's dark navy `#0f0a1e` so it blends seamlessly with the page.

## Changes

1. **`index.html`** (line 10) — Update `<meta name="theme-color" content="#ec4899" />` to `#0f0a1e`.
2. **`public/manifest.json`** (line 8) — Update `"theme_color": "#ec4899"` to `"#0f0a1e"` so the installed PWA also uses navy.

## Notes

- After publishing, the change takes effect on a fresh load. On already-installed PWAs, the user may need to reload (or reinstall) for the new theme color to apply, since installed manifests are cached by the OS/browser.
