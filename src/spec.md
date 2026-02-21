# Specification

## Summary
**Goal:** Remove AMONGSTT token from the default whitelist while preserving user customizations.

**Planned changes:**
- Remove AMONGSTT token entry from DEFAULT_TOKENS array in frontend/src/lib/tokenConfig.ts
- Maintain all other 10 tokens (JewNomicaN, GreedyJEW, HEBROID, ASC, RPR, PLR, ARK, Schmeckles, MKS, TriForce, DeerChickenn) unchanged
- Ensure localStorage configurations containing AMONGSTT continue to work without errors

**User-visible outcome:** AMONGSTT no longer appears in the default token list for new users, while existing users who added AMONGSTT can still see it until they manually remove it.
