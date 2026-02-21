# Specification

## Summary
**Goal:** Add a token whitelist configuration interface to allow users to specify which tokens to monitor.

**Planned changes:**
- Create a token configuration interface where users can add, edit, and remove tokens by entering currency codes and issuer addresses
- Update TokenList.tsx to filter and display only whitelisted tokens instead of all trust lines
- Pre-populate the configuration with GreedyJEW (issuer rdRvw4pKmEtSnz3cjXBL6HLJJmejtkoQ4) and Jewnomican (issuer rEz5RdLqRex7YxYZ1bEskCDHbvKy3zcUnq) as default monitored tokens
- Add a settings button on the dashboard to access the token configuration interface
- Store token configuration in localStorage for persistence between sessions

**User-visible outcome:** Users can configure which tokens they want to monitor by managing a whitelist, with the token list displaying only their selected tokens. The configuration persists between sessions and comes pre-populated with two default tokens.
