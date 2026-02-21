import { validateXRPLAddress } from './xrpl';

export interface TokenConfig {
  currency: string;
  issuer: string;
  customName?: string;
}

const STORAGE_KEY = 'xrpl_token_config';

// Helper function to convert hex-encoded currency codes to ASCII
export function hexToString(hex: string): string {
  // XRPL uses 160-bit (40 character) hex strings for non-standard currency codes
  if (hex.length !== 40) {
    return hex;
  }
  
  try {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      const charCode = parseInt(hex.substr(i, 2), 16);
      if (charCode === 0) break; // Stop at null terminator
      str += String.fromCharCode(charCode);
    }
    return str.trim() || hex;
  } catch (e) {
    console.error('[TokenConfig] Error decoding hex string:', e);
    return hex;
  }
}

// Helper function to convert ASCII currency codes to hex (for non-standard codes)
export function stringToHex(str: string): string {
  // Standard 3-character codes don't need conversion
  if (str.length === 3) {
    return str;
  }
  
  // Convert to hex and pad to 40 characters
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  // Pad with zeros to make it 40 characters (160 bits)
  return hex.padEnd(40, '0').toUpperCase();
}

// Default tokens to monitor - ALL 10 TOKENS
const DEFAULT_TOKENS: TokenConfig[] = [
  {
    currency: 'GreedyJEW',
    issuer: 'rdRvw4pKmEtSnz3cjXBL6HLJJmejtkoQ4',
    customName: 'GreedyJEW Token'
  },
  {
    currency: 'JewNomicaN',
    issuer: 'rEz5RdLqRex7YxYZ1bEskCDHbvKy3zcUnq',
    customName: 'JewNomicaN'
  },
  {
    currency: 'HEBROID',
    issuer: 'rdRvw4pKmEtSnz3cjXBL6HLJJmejtkoQ4',
    customName: 'HEBROID'
  },
  {
    currency: 'ASC',
    issuer: 'r3qWgpz2ry3BhcRJ8JE6rxM8esrfhuKp4R',
    customName: 'Ascension'
  },
  {
    currency: 'RPR',
    issuer: 'r3qWgpz2ry3BhcRJ8JE6rxM8esrfhuKp4R',
    customName: 'Reaper'
  },
  {
    currency: 'PLR',
    issuer: 'rNSYhWLhuHvmURwWbJPBKZMSPsyG5Qek17',
    customName: 'Pylons'
  },
  {
    currency: 'ARK',
    issuer: 'rf5Jzzy6oAFBJjLhokha1v8pXVgYYjee3b',
    customName: 'Ark Institute'
  },
  {
    currency: 'Schmeckles',
    issuer: 'rPxw83ZP6thv7KmG5DpAW4cDW55DZRZ9wu',
    customName: 'Schmeckles'
  },
  {
    currency: 'MKS',
    issuer: 'rwU8xXxSQPzqX7DEfeSUdUjb5NB17ixkzJ',
    customName: 'MKS'
  },
  {
    currency: 'TriForce',
    issuer: 'rGeevxdLguXxvh7RmUmMEXr7DSRNTXPRpX',
    customName: 'TriForce'
  },
  {
    currency: 'DeerChickenn',
    issuer: 'rw3DPxgusRrvdsbXSjHdXD14ogkNidTTRx',
    customName: 'DeerChickenn'
  }
];

export function getWhitelistedTokens(): TokenConfig[] {
  const tokens = loadTokenConfig();
  console.log('[TokenConfig] getWhitelistedTokens() called');
  console.log('[TokenConfig] Returning whitelist with', tokens.length, 'tokens:');
  tokens.forEach((token, idx) => {
    console.log(`[TokenConfig]   [${idx}] ${token.currency} (${token.issuer})`);
  });
  return tokens;
}

export function loadTokenConfig(): TokenConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log('[TokenConfig] No stored config found, using DEFAULT_TOKENS');
      console.log('[TokenConfig] Default tokens count:', DEFAULT_TOKENS.length);
      // Initialize with defaults on first load
      saveTokenConfig(DEFAULT_TOKENS);
      return DEFAULT_TOKENS;
    }
    const parsed = JSON.parse(stored);
    console.log('[TokenConfig] Loaded config from localStorage');
    console.log('[TokenConfig] Stored tokens count:', parsed.length);
    
    // If stored config has fewer tokens than DEFAULT_TOKENS, merge them
    if (parsed.length < DEFAULT_TOKENS.length) {
      console.log('[TokenConfig] Stored config has fewer tokens, merging with defaults...');
      const merged = [...parsed];
      
      DEFAULT_TOKENS.forEach(defaultToken => {
        const exists = merged.some(
          t => t.currency === defaultToken.currency && t.issuer === defaultToken.issuer
        );
        if (!exists) {
          console.log(`[TokenConfig] Adding missing token: ${defaultToken.currency}`);
          merged.push(defaultToken);
        }
      });
      
      console.log('[TokenConfig] Merged config now has', merged.length, 'tokens');
      saveTokenConfig(merged);
      return merged;
    }
    
    return parsed;
  } catch (error) {
    console.error('[TokenConfig] Error loading config:', error);
    console.log('[TokenConfig] Falling back to DEFAULT_TOKENS');
    return DEFAULT_TOKENS;
  }
}

export function saveTokenConfig(tokens: TokenConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    console.log('[TokenConfig] Saved', tokens.length, 'tokens to localStorage');
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
  
  // Normalize inputs for comparison
  const normalizedIssuer = issuer.toLowerCase().trim();
  
  // Check if currency is a hex-encoded string (40 characters, all hex)
  const isHexCurrency = currency.length === 40 && /^[0-9A-F]{40}$/i.test(currency);
  
  console.log('[TokenConfig] isTokenWhitelisted() checking:', {
    currency,
    isHex: isHexCurrency,
    issuer: normalizedIssuer
  });
  
  // Try to match against whitelist
  const matched = tokens.some(t => {
    const normalizedWhitelistIssuer = t.issuer.toLowerCase().trim();
    
    // First check if issuers match
    if (normalizedWhitelistIssuer !== normalizedIssuer) {
      return false;
    }
    
    // If currency from XRPL is hex-encoded, try to decode it
    if (isHexCurrency) {
      const decodedCurrency = hexToString(currency);
      const currencyMatch = 
        decodedCurrency.toLowerCase() === t.currency.toLowerCase() ||
        currency.toLowerCase() === stringToHex(t.currency).toLowerCase();
      
      console.log('[TokenConfig]   Comparing hex currency:', {
        xrplHex: currency,
        decoded: decodedCurrency,
        whitelistCurrency: t.currency,
        whitelistHex: stringToHex(t.currency),
        match: currencyMatch
      });
      
      return currencyMatch;
    }
    
    // Standard currency code comparison (case-insensitive)
    const currencyMatch = currency.toLowerCase() === t.currency.toLowerCase();
    
    console.log('[TokenConfig]   Comparing standard currency:', {
      xrplCurrency: currency,
      whitelistCurrency: t.currency,
      match: currencyMatch
    });
    
    return currencyMatch;
  });
  
  console.log('[TokenConfig]   -> Result:', matched ? 'MATCHED' : 'NOT MATCHED');
  
  return matched;
}
