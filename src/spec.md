# Specification

## Summary
**Goal:** Display only the relevant wallet (either issuer or holder) in the token detail view instead of showing both monitored wallets.

**Planned changes:**
- Update TokenMetrics.tsx to filter and show only the wallet that holds the selected token
- Implement logic to determine wallet relevance by checking trust line balances for the token
- Remove duplicate wallet displays when viewing token details

**User-visible outcome:** When clicking "view more" on a token, users will see only the wallet that actually holds or issues that specific token, eliminating the unnecessary display of both monitored wallets.
