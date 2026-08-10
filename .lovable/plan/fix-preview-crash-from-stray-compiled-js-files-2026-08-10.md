# Fix: preview crash from stray compiled .js files

## What's happening

Two compiled JavaScript duplicates were written into the project alongside the real TypeScript sources:

- `src/pages/Home.js` (duplicate of `src/pages/Home.tsx`)
- `src/utils/voiceGreeting.js` (duplicate of `src/utils/voiceGreeting.ts`)

They were emitted during the recent Google display-name change. Both contain JSX/TS-style code but carry a `.js` extension. Vite resolves extensionless imports like `@/pages/Home` using `.js` **before** `.tsx`, so it loads `Home.js`, fails to parse the JSX inside it, and throws:

`[plugin:vite:import-analysis] Failed to parse source for import analysis ... /src/pages/Home.js:106:17`

The TypeScript sources are correct and unchanged — the duplicates are the only problem.

## Plan

1. Delete `src/pages/Home.js`.
2. Delete `src/utils/voiceGreeting.js`.
3. Reload the preview and confirm the home page renders with the "Good evening, NovaDela Technologies" greeting and no overlay error.

## Notes

No source changes are needed; the Google name fix already lives in `Home.tsx` and `voiceGreeting.ts`. Nothing imports the `.js` files explicitly.
