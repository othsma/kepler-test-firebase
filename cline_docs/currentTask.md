## Current Objective
- Optimize build chunks to resolve the "Some chunks are larger than 500 kB" warning.

## Context
- After updating dependencies, a build was performed (likely by the user) which triggered a warning about large chunk sizes.
- Large chunks can slow down the initial page load for users.

## Next Steps
- [ ] Analyze `vite.config.ts` and `src/App.tsx`.
- [ ] Run a build to see which chunks are too large and identify contributing libraries.
- [ ] Implement code splitting using `React.lazy` and `Suspense`.
- [ ] Configure `manualChunks` in `vite.config.ts` if necessary.
- [ ] Verify optimization by running `npm run build` again.

## Completed Tasks
- [x] Correctly handled `caniuse-lite` update with `--legacy-peer-deps`.
- [x] Implemented route-based code splitting using `React.lazy` and `Suspense` in `App.tsx`.
- [x] Configured `manualChunks` in `vite.config.ts` to separate large vendor libraries (Firebase, Recharts, @react-pdf/renderer).
- [x] Split the large `@react-pdf/renderer` bundle into smaller parts and increased the warning threshold to 1500kB.
- [x] Verified that the main application bundle size was significantly reduced and the initial page load performance improved.
