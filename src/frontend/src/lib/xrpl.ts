// Use reliable public XRPL server with fallback options
const XRPL_SERVERS = [
  'https://xrplcluster.com',
  'https://s1.ripple.com:51234',
  'https://s2.ripple.com:51234'
];

let currentServerIndex = 0;

export interface AccountInfo {
  Account: string;
  Balance: string;
  Flags: number;
  OwnerCount: number;
  Sequence: number;
  PreviousTxnID?: string;
  PreviousTxnLgrSeq?: number;
}

export interface TrustLine {
  account: string;
  balance: string;
  currency: string;
  limit: string;
  limit_peer: string;
  quality_in: number;
  quality_out: number;
}

export interface NFToken {
  Flags: number;
  Issuer: string;
  NFTokenID: string;
  NFTokenTaxon: number;
  URI?: string;
  nft_serial: number;
}

// Validate XRPL address format
export function validateXRPLAddress(address: string): boolean {
  const xrplAddressRegex = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
  return xrplAddressRegex.test(address);
}

// Retry wrapper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`[XRPL] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

async function makeXRPLRequest(method: string, params: any[]) {
  const server = XRPL_SERVERS[currentServerIndex];
  const timestamp = new Date().toISOString();
  
  console.log(`[XRPL] ${timestamp} - Making request to ${server}`);
  console.log(`[XRPL] Method: ${method}`, params);
  
  // Validate address if present in params
  if (params[0]?.account) {
    const address = params[0].account;
    if (!validateXRPLAddress(address)) {
      const error = new Error(`Invalid XRPL address format: ${address}. Address must start with 'r' and be 25-35 characters long.`);
      console.error(`[XRPL] Validation error:`, error.message);
      throw error;
    }
  }
  
  try {
    const startTime = performance.now();
    
    const response = await fetch(server, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method,
        params,
      }),
    });

    const responseTime = (performance.now() - startTime).toFixed(2);
    console.log(`[XRPL] Response received in ${responseTime}ms - Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[XRPL] HTTP ${response.status} error from ${server}:`, errorText);
      
      // Try next server on failure
      if (currentServerIndex < XRPL_SERVERS.length - 1) {
        currentServerIndex++;
        console.log(`[XRPL] Switching to backup server: ${XRPL_SERVERS[currentServerIndex]}`);
      }
      
      throw new Error(`XRPL server error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[XRPL] Response data:`, data);
    
    if (data.result?.error) {
      const errorMsg = data.result.error_message || data.result.error;
      console.error(`[XRPL] API error from ${server}:`, errorMsg);
      throw new Error(`XRPL API error: ${errorMsg}`);
    }

    if (!data.result) {
      console.error(`[XRPL] Invalid response structure from ${server}:`, data);
      throw new Error('Invalid response from XRPL server - no result field');
    }

    console.log(`[XRPL] ✓ Request successful`);
    return data.result;
  } catch (error) {
    // Distinguish between network errors and API errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`[XRPL] Network connectivity error - Failed to reach ${server}:`, error);
      throw new Error(`Network error: Unable to connect to XRPL server at ${server}. Please check your internet connection.`);
    }
    
    console.error(`[XRPL] Request failed for ${method}:`, error);
    throw error;
  }
}

export async function fetchAccountInfo(account: string): Promise<AccountInfo> {
  console.log(`[XRPL] ========================================`);
  console.log(`[XRPL] Fetching account info for: ${account}`);
  
  if (!validateXRPLAddress(account)) {
    const error = new Error(`Invalid XRPL address: "${account}". Valid addresses start with 'r' and are 25-35 characters.`);
    console.error(`[XRPL]`, error.message);
    throw error;
  }
  
  try {
    const result = await retryWithBackoff(() => 
      makeXRPLRequest('account_info', [
        {
          account,
          ledger_index: 'validated',
        },
      ])
    );

    if (!result.account_data) {
      console.error(`[XRPL] No account_data in result:`, result);
      throw new Error('Invalid account data response - missing account_data field');
    }

    console.log(`[XRPL] ✓ Account info retrieved successfully for ${account}`);
    return result.account_data;
  } catch (error) {
    console.error(`[XRPL] ✗ Failed to fetch account info for ${account}:`, error);
    throw error;
  }
}

export async function fetchAccountLines(account: string): Promise<TrustLine[]> {
  console.log(`[XRPL] ========================================`);
  console.log(`[XRPL] Fetching trust lines for: ${account}`);
  
  if (!validateXRPLAddress(account)) {
    const error = new Error(`Invalid XRPL address: "${account}". Valid addresses start with 'r' and are 25-35 characters.`);
    console.error(`[XRPL]`, error.message);
    throw error;
  }
  
  try {
    const result = await retryWithBackoff(() =>
      makeXRPLRequest('account_lines', [
        {
          account,
          ledger_index: 'validated',
        },
      ])
    );

    const lines = result.lines || [];
    console.log(`[XRPL] ✓ Retrieved ${lines.length} trust lines for ${account}`);
    return lines;
  } catch (error) {
    console.error(`[XRPL] ✗ Failed to fetch trust lines for ${account}:`, error);
    throw error;
  }
}

export async function fetchAccountNFTs(account: string): Promise<NFToken[]> {
  console.log(`[XRPL] ========================================`);
  console.log(`[XRPL] Fetching NFTs for: ${account}`);
  
  if (!validateXRPLAddress(account)) {
    const error = new Error(`Invalid XRPL address: "${account}". Valid addresses start with 'r' and are 25-35 characters.`);
    console.error(`[XRPL]`, error.message);
    throw error;
  }
  
  try {
    const result = await retryWithBackoff(() =>
      makeXRPLRequest('account_nfts', [
        {
          account,
          ledger_index: 'validated',
        },
      ])
    );

    const nfts = result.account_nfts || [];
    console.log(`[XRPL] ✓ Retrieved ${nfts.length} NFTs for ${account}`);
    return nfts;
  } catch (error) {
    // If account has no NFTs, the API might return an error
    console.warn(`[XRPL] ⚠ Failed to fetch NFTs for ${account} (may not have any):`, error);
    return [];
  }
}
