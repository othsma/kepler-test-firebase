## Current Objective
- Fix the dropdown behavior in the repair ticket form where menus stay open after selection.

## Context
- Users reported that in `/tickets`, when creating a new ticket, the dropdowns for device type, brand, model, and tasks do not close after an option is selected.
- This UI issue makes the form difficult to use.

## Next Steps
- [ ] Analyze `src/pages/SimpleTickets.tsx` to identify the dropdown component implementation.
- [ ] Fix the dropdowns (likely using Headless UI `Combobox` or `Listbox`) to ensure they close on selection.
- [ ] Verify the fix.

## Completed Tasks
- [x] Correctly handled `caniuse-lite` update with `--legacy-peer-deps`.
- [x] Implemented route-based code splitting and manual chunking.
- [x] Fixed Netlify deployment failure with `.npmrc`.
- [x] Confirmed protection against CVE-2025-55182 (React 19.2.3 is safe).
