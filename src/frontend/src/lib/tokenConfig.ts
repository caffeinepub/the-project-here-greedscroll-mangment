import { validateXRPLAddress } from './xrpl';

export interface TokenConfig {
  currency: string;
  issuer: string;
  customName?: string;
}

const STORAGE_KEY = 'xrpl_token_config';

// Default tokens to monitor
const DEFAULT_TOKENS: TokenConfig[] = [
  {
    currency: 'GreedyJEW',
    issuer: 'rdRvw4pKmEtSnz3cjXBL6HLJJmejtkoQ4',
    customName: 'GreedyJEW Token'
  },
  {
    currency: 'Jewnomican',
    issuer: 'rEz5RdLqRex7YxYZ1bEskCDHbvKy3zcUnq',
    customName: 'Jewnomican Token'
  }
];

export function loadTokenConfig(): TokenConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Initialize with defaults on first load
      saveTokenConfig(DEFAULT_TOKENS);
      return DEFAULT_TOKENS;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('[TokenConfig] Error loading config:', error);
    return DEFAULT_TOKENS;
  }
}

export function saveTokenConfig(tokens: TokenConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('[TokenConfig] Error saving config:', error);
    throw new Error('Failed to save token configuration');
  }
}

export function addToken(token: TokenConfig): void {
  const tokens = loadTokenConfig();
  
  // Validate issuer address
  if (!validateXRPLAddress(token.issuer)) {
    throw new Error('Invalid XRPL address format. Address must start with "r" and be 25-35 characters long.');
  }
  
  // Check for duplicates
  const exists = tokens.some(
    t => t.currency === token.currency && t.issuer === token.issuer
  );
  
  if (exists) {
    throw new Error('This token is already in your monitoring list');
  }
  
  tokens.push(token);
  saveTokenConfig(tokens);
}

export function removeToken(currency: string, issuer: string): void {
  const tokens = loadTokenConfig();
  const filtered = tokens.filter(
    t => !(t.currency === currency && t.issuer === issuer)
  );
  saveTokenConfig(filtered);
}

export function updateToken(
  oldCurrency: string,
  oldIssuer: string,
  newToken: TokenConfig
): void {
  // Validate new issuer address
  if (!validateXRPLAddress(newToken.issuer)) {
    throw new Error('Invalid XRPL address format. Address must start with "r" and be 25-35 characters long.');
  }
  
  const tokens = loadTokenConfig();
  const index = tokens.findIndex(
    t => t.currency === oldCurrency && t.issuer === oldIssuer
  );
  
  if (index === -1) {
    throw new Error('Token not found');
  }
  
  // Check if the new combination already exists (unless it's the same token)
  const isDuplicate = tokens.some(
    (t, i) => i !== index && t.currency === newToken.currency && t.issuer === newToken.issuer
  );
  
  if (isDuplicate) {
    throw new Error('A token with this currency and issuer already exists');
  }
  
  tokens[index] = newToken;
  saveTokenConfig(tokens);
}

export function isTokenWhitelisted(currency: string, issuer: string): boolean {
  const tokens = loadTokenConfig();
  return tokens.some(t => t.currency === currency && t.issuer === issuer);
}
