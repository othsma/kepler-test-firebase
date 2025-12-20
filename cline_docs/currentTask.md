## Current Objective
- Fix the POS checkout issue where sales with existing clients don't register.

## Context
- In `/pos`, "Quick sell (no client info)" works correctly.
- Selecting an existing client results in the sale not registering and the invoice not being generated.
- This is a critical blocker for the sales workflow when client tracking is needed.

## Next Steps
- [x] Read `src/pages/Pos.tsx` to identify checkout logic.
- [x] Debug the difference between quick sell and client sell.
- [x] Fix the logic in `handleCheckout` or the relevant Zustand store method.
- [x] Verify functionality.

## Completed Tasks
- [x] Correctly handled `caniuse-lite` update with `--legacy-peer-deps`.
- [x] Implemented route-based code splitting and manual chunking.
- [x] Fixed Netlify deployment failure with `.npmrc`.
- [x] Confirmed protection against CVE-2025-55182.
- [x] Fixed dropdown closing behavior in `SimpleTickets.tsx`.
