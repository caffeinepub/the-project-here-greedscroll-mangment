# Specification

## Summary
**Goal:** Update the XRP Portfolio Monitor to track the greedyjew issuer wallet and project dev wallet instead of placeholder addresses.

**Planned changes:**
- Replace monitored wallet addresses in TokenList component with rdRvw4pKmEtSnz3cjXBL6HLJJmejtkoQ4 (GreedyJEW Issuer) and rw3DPxgusRrvdsbXSjHdXD14ogkNidTTRx (Project Dev Wallet)
- Update TokenMetrics component to fetch token holdings from both new wallet addresses
- Update WalletHoldings component to support viewing detailed holdings for both wallets with proper wallet identification in the UI
- Remove previous placeholder wallet addresses

**User-visible outcome:** The dashboard displays real-time data for the greedyjew issuer wallet and project dev wallet, showing trust lines, balances, token holdings, and NFTs with clear wallet identification labels.
