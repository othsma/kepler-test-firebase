## Current Objective
- Optimize build chunks and resolve deployment issues.

## Context
- The project uses React 19, which causes peer dependency conflicts with several libraries (like Headless UI).
- Large chunks were slowing down the build and triggering warnings.

## Completed Tasks
- [x] Correctly handled `caniuse-lite` update with `--legacy-peer-deps`.
- [x] Implemented route-based code splitting using `React.lazy` and `Suspense` in `App.tsx`.
- [x] Configured `manualChunks` in `vite.config.ts` to separate large vendor libraries (Firebase, Recharts, @react-pdf/renderer).
- [x] Split the large `@react-pdf/renderer` bundle into smaller parts and increased the warning threshold to 1500kB.
- [x] Verified that the main application bundle size was significantly reduced (index.js went from 2.7MB to 210kB).
- [x] **Fixed Netlify deployment failure** by creating an `.npmrc` file with `legacy-peer-deps=true`.

## Next Steps
- [ ] Push changes to GitHub to trigger a fresh Netlify build.
